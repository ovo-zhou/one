import { Badge, type BadgeProps } from "@mantine/core";
import classes from "./StatusBadge.module.css";

export default function StatusBadge({ color, children }: Pick<BadgeProps, "color" | "children">) {
  return (
    <Badge
      color={color}
      variant="light"
      display="inline-flex"
      className={classes.badge}
      styles={{ root: { position: "relative", alignItems: "center", gap: 6 } }}
    >
      {children}
    </Badge>
  );
}
