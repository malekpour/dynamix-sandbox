import {
  types,
  SnapshotIn,
  Instance,
  UnionOptions,
  ISimpleType,
  IAnyModelType,
} from "mobx-state-tree";

export interface IPropertyModel
  extends ReturnType<() => typeof PropertyModel> {}

const typeNames = [
  "string",
  "number",
  "boolean",
  "array",
  "computed",
  "object",
];

export const PropertyModel = types
  .model("Property", {
    type: types.optional(types.enumeration(typeNames), "object"),
    optional: types.optional(types.boolean, true),
    default: types.frozen(),
  })
  .views((self) => ({
    runtimeType() {
      return types.undefined;
    },
  }));

function runtimeType<T>(
  type: ISimpleType<T>,
  isOptional: boolean,
  defaultValue: T,
  validation?: {
    use: boolean;
    condition: (val: T) => boolean;
    message: string;
  }[]
) {
  const result = isOptional
    ? defaultValue
      ? types.optional(type, defaultValue)
      : types.maybe(type)
    : type;

  const validating = validation && validation.filter((v) => v.use);
  if (validating && validating.length) {
    return types.refinement(
      result,
      (snp) =>
        snp === undefined || !validating.some((val) => val.condition(snp)),
      (snp) => validating.filter((val) => val.condition(snp!))[0].message
    );
  }

  return result;
}

export const StringPropertyModel = PropertyModel.named("StringProperty").views(
  (self) => ({
    runtimeType() {
      return runtimeType(types.string, self.optional, self.default);
    },
  })
);

export const NumberPropertyModel = PropertyModel.named("NumberProperty")
  .props({
    min: types.maybe(types.number),
    max: types.maybe(types.number),
  })
  .views((self) => ({
    runtimeType() {
      return runtimeType(types.number, self.optional, self.default, [
        {
          use: self.min !== undefined,
          condition: (val) => val < self.min!,
          message: `Value must be equal or greater than ${self.min}`,
        },
        {
          use: self.max !== undefined,
          condition: (val) => val > self.max!,
          message: `Value must be equal or lower than ${self.max}`,
        },
      ]);
    },
  }));

export const BooleanPropertyModel = PropertyModel.named(
  "BooleanProperty"
).views((self) => ({
  runtimeType() {
    return runtimeType(types.boolean, self.optional, self.default);
  },
}));

export const ArrayPropertyModel = PropertyModel.named("ArrayProperty")
  .props({
    items: types.late((): IPropertyModel => AnyPropertyModel as IPropertyModel),
  })
  .views((self) => ({
    runtimeType() {
      return runtimeType(
        types.array(self.items.runtimeType()),
        self.optional,
        self.default
      );
    },
  }));

export const ComputedPropertyModel = PropertyModel.named("ComputedProperty")
  .props({
    expression: types.string,
  })
  .views((self) => ({
    runtimeType() {
      return new Function(self.expression);
    },
  }));

export const ComplexPropertyModel = PropertyModel.named("ComplexProperty")
  .props({
    properties: types.map(
      types.late((): IPropertyModel => AnyPropertyModel as IPropertyModel)
    ),
  })
  .views((self) => ({
    createType() {
      const props = {} as { [key: string]: IAnyModelType };
      const views = {} as { [key: string]: () => any };

      Array.from(self.properties.entries()).forEach(([name, prop]) => {
        if (prop.type !== "computed") {
          props[name] = prop.runtimeType() as any as IAnyModelType;
        } else {
          Object.defineProperty(views, name, {
            get: () => {
              console.log("computed called");
              return prop.runtimeType() as any as () => any;
            },
            configurable: true,
          });
        }
      });

      return types.model({ ...props }).views((self) => views);
    },
    runtimeType() {
      return runtimeType(this.createType(), self.optional, self.default);
    },
  }));

export const AnyPropertyModel = types.union(
  {
    eager: false,
    dispatcher: (snp: SnapshotIn<IPropertyModel>) =>
      snp.type === "string"
        ? StringPropertyModel
        : snp.type === "number"
        ? NumberPropertyModel
        : snp.type === "boolean"
        ? BooleanPropertyModel
        : snp.type === "array"
        ? ArrayPropertyModel
        : snp.type === "computed"
        ? ComputedPropertyModel
        : snp.type === "object"
        ? ComplexPropertyModel
        : undefined,
  } as UnionOptions,
  StringPropertyModel,
  NumberPropertyModel,
  BooleanPropertyModel,
  ArrayPropertyModel,
  ComputedPropertyModel,
  ComplexPropertyModel
);

export interface IProperty extends Instance<typeof PropertyModel> {}
export interface IStringProperty extends Instance<typeof StringPropertyModel> {}
export interface INumberProperty extends Instance<typeof NumberPropertyModel> {}
export interface IBooleanProperty
  extends Instance<typeof BooleanPropertyModel> {}
export interface IArrayProperty extends Instance<typeof ArrayPropertyModel> {}
export interface IComputedProperty
  extends Instance<typeof ComputedPropertyModel> {}
export interface IComplexProperty
  extends Instance<typeof ComplexPropertyModel> {}
export type IAnyProperty =
  | IProperty
  | IStringProperty
  | INumberProperty
  | IBooleanProperty
  | IArrayProperty
  | IComputedProperty
  | IComplexProperty;

export function isStringProperty(x: IProperty): x is IStringProperty {
  return x.type === "string";
}

export function isNumberProperty(x: IProperty): x is INumberProperty {
  return x.type === "number";
}

export function isBooleanProperty(x: IProperty): x is IBooleanProperty {
  return x.type === "boolean";
}

export function isComputedProperty(x: IProperty): x is IComputedProperty {
  return x.type === "computed";
}

export function isComplexProperty(x: IProperty): x is IComplexProperty {
  return x.type === "object";
}
