import { forwardRef } from "react";
import { register } from "./renderer";

import "./Button.css";

const Button = forwardRef<HTMLButtonElement>((props, ref) => {
  return <button className="button" ref={ref} {...props} />;
});

register("Button", Button);
