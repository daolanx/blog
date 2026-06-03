import { Languages } from "lucide-react"

export function LanguageToggle() {
  const handleLanguageToggle = () => {
    const currentPath = window.location.pathname

    const newPath = currentPath.includes("/en")
      ? currentPath.replace("/en", "/zh")
      : currentPath.replace("/zh", "/en")

    window.location.href = newPath
  }

  return (
    <button
      onClick={handleLanguageToggle}
      aria-label="Toggle language"
      title="Toggle language"
      className="cursor-pointer"
    >
      <Languages />
    </button>
  )
}
