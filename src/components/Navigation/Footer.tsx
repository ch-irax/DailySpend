export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-line/70 py-6 text-center text-xs pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">
      <div className="mx-auto flex max-w-[1000px] flex-col items-center justify-center gap-1.5 px-4">
        <p className="font-bold uppercase tracking-wider text-[#D4AF37]">
          Developed by Chirag
        </p>
        <p className="text-taupe">
          Find me here:{' '}
          <a
            href="https://ch-irax.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-coffee underline underline-offset-4 transition hover:text-[#D4AF37]"
          >
            https://ch-irax.netlify.app/
          </a>
        </p>
      </div>
    </footer>
  )
}
