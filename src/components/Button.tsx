import { forwardRef } from "react";

import "./Button.css";

export const Button = forwardRef<HTMLButtonElement>((props, ref) => {
  return <button className="button" ref={ref} {...props} />;
});
