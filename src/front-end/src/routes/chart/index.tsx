import { createFileRoute } from '@tanstack/react-router'
import styles from "./styles.module.css"

export const Route = createFileRoute('/chart/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className={styles.root}>Hello "/chart/"!</div>
}
