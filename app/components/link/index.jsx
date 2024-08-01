import NextLink  from "next/link";
import styles from './index.module.css'
export default function Link(props){
  const {href}=props;
  return <NextLink className={styles.componentLink} href={href}>{props.children}</NextLink>
}