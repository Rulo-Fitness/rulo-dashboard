"use client"

type AppSignatureProps = {
  className?: string
}

export function AppSignature({ className = "" }: AppSignatureProps) {
  return (
    <div className={`px-6 pt-8 ${className}`}>
      <p className="text-center text-xs text-muted-foreground/75">
        Rulo AI, version 1.0
      </p>
    </div>
  )
}
