import { ValueExpression } from "adaptive-expressions";
import { observer } from "mobx-react-lite";
import { applyPatch } from "mobx-state-tree";

type EntryBase = { "<>"?: string; [key: string]: unknown };
type EntryText = string | number;
type EntryChild = EntryBase | EntryText;
type EntryArray = Array<EntryChild>;
type EntryNode =
  | (($event: Event) => void)
  | EntryChild
  | boolean
  | null
  | undefined
  | EntryArray
  | React.ReactElement;

const GlobalRegistry = new Map<string, React.FC>([
  ["undefined", () => <>undefined</>],
]);

function processEntry(
  registry: Map<string, React.FC>,
  entry: EntryNode,
  context: object,
  key?: string
): EntryNode {
  if (entry === null || entry === undefined) {
    return entry;
  }

  if (typeof entry === "boolean" || typeof entry === "number") {
    return entry;
  }

  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (trimmed.startsWith("#")) {
      const expression = new ValueExpression(trimmed.substring(1));
      const { value, error } = expression.tryGetValue(context);
      if (error) {
        console.error(error);
      }
      return value;
    }

    if (trimmed.startsWith("%")) {
      const expression = new ValueExpression(trimmed.substring(1));
      return ($event) => {
        const exp = expression.tryGetValue({ ...context, $event });

        if (exp.error) {
          console.error(exp.error);
        }

        const [target, op, path, value] = exp.value;
        applyPatch(target, { op, path, value });
      };
    }

    return entry;
  }

  if (Array.isArray(entry)) {
    return entry.map((item, index) => {
      return processEntry(registry, item, context, index.toString());
    }) as EntryArray;
  }

  if ("[]" in entry && entry["[]"]) {
    const { "[]": collection, template } = entry;

    const Collection = observer(() => {
      const result = processEntry(
        registry,
        collection as EntryArray,
        context
      ) as [];
      return (
        <>
          {result.map(($self, $index) =>
            processEntry(
              registry,
              template as EntryChild,
              {
                ...context,
                $self,
                $index,
              },
              $index.toString()
            )
          )}
        </>
      );
    });

    return <Collection key={key} />;
  }

  if ("<>" in entry && entry["<>"]) {
    const { "<>": type, ...props } = entry;

    const Element = observer(() => {
      const Component = registry.get(type) ?? type;

      const attributes = Object.assign(
        {},
        ...Object.keys(props).map((name) => ({
          [name]: processEntry(registry, props[name] as EntryNode, context),
        }))
      );

      return <Component {...attributes} />;
    });

    return <Element key={key} />;
  }

  return entry;
}

export function renderView(view: { root: EntryNode }, context: object) {
  if (!view?.root) {
    return <h1>Empety View</h1>;
  }

  return processEntry(GlobalRegistry, view.root, context) as React.ReactElement;
}

export function register(name: string, node: React.FC<any>) {
  GlobalRegistry.set(name, node);
}
