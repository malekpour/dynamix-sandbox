import { useMemo } from "react";
import { renderView, register } from "./renderer";

import { ComplexPropertyModel } from "./properties";
import { observer } from "mobx-react-lite";

import { Button } from "../components/Button";
register("Button", Button);

export const MobxView = observer(
  ({ model, view }: { model: any; view: any }) => {
    const modelType = useMemo(
      () => ComplexPropertyModel.create(model).runtimeType(),
      [model]
    );
    const data = useMemo(() => modelType.create({} as any) as any, []);

    const component = useMemo(
      () => renderView(view, { $root: data, $self: data }),
      [view]
    );

    return (
      <div className="main">
        <div className="view">{component}</div>
        <div className="code">
          <h3>Model Description</h3>
          <code>{modelType.describe()}</code>
          <h3>Model Data</h3>
          <pre>{JSON.stringify(data, null, "  ")}</pre>
        </div>
      </div>
    );
  }
);
