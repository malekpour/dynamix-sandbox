import "./App.css";
import { useMemo } from "react";
import { renderView } from "./renderer";

import sample from "./sample.json";
import { ComplexPropertyModel } from "./dynamix";
import { observer } from "mobx-react-lite";

import "./Button";

const modelType = ComplexPropertyModel.create(sample.model).runtimeType();

const model = modelType.create({} as any) as any;

const View = observer(() => {
  const view = useMemo(
    () => renderView(sample.view, { $root: model, $self: model }),
    [sample.view]
  );

  return (
    <>
      {view}
      <pre>{JSON.stringify(model, null, "  ")}</pre>
      <code>{modelType.describe()}</code>
    </>
  );
});

export default function App() {
  return <View />;
}
