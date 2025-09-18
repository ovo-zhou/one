import { Components } from "react-markdown";
const components: Components = {
  h1(props) {
    const { node, ...rest } = props;
    return (
      <h1
        className="text-[clamp(1.8rem,4vw,2.5rem)] font-bold  leading-tight"
        {...rest}
      />
    );
  },
  h2(props) {
    const { node, ...rest } = props;
    return (
      <h2
        className="text-[clamp(1.5rem,3.5vw,2rem)] font-bold leading-tight"
        {...rest}
      />
    );
  },
  h3(props) {
    const { node, ...rest } = props;
    return (
      <h3
        className="text-[clamp(1.3rem,3vw,1.75rem)] font-bold leading-tight"
        {...rest}
      />
    );
  },
  h4(props) {
    const { node, ...rest } = props;
    return (
      <h4
        className="text-[clamp(1.15rem,2.5vw,1.5rem)] font-semibold leading-tight"
        {...rest}
      />
    );
  },
  h5(props) {
    const { node, ...rest } = props;
    return (
      <h5
        className="text-[clamp(1rem,2vw,1.25rem)] font-semibold leading-tight"
        {...rest}
      />
    );
  },
  h6(props) {
    const { node, ...rest } = props;
    return (
      <h6
        className="text-[clamp(0.9rem,1.5vw,1.1rem)] font-semibold leading-tight"
        {...rest}
      />
    );
  },
};
export default components;
