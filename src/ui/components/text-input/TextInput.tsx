import styles from "./TextInput.module.scss"

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">

export function TextInput({ className, ...rest }: Props) {
  return (
    <input
      type="text"
      className={styles.textInput + (className ? ` ${className}` : "")}
      {...rest}
    />
  )
}
