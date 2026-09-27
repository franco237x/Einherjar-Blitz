export function MiniLoader() {
  return (
    <div className="flex flex-1 items-center justify-center bg-ink py-12">
      <div className="relative flex h-[95px] w-[95px] items-center justify-center">
        <span
          className="absolute h-[95px] w-[95px] rounded-full border-[3px] border-transparent border-t-gold border-b-gold/60"
          style={{ animation: 'juego-spin 2s linear infinite' }}
        />
        <span
          className="absolute h-[82px] w-[82px] rounded-full border-[3px] border-transparent border-l-gold border-r-gold/60 opacity-60"
          style={{ animation: 'juego-spin-reverse 2s linear infinite' }}
        />
        <div className="h-[70px] w-[70px] overflow-hidden rounded-full border-2 border-ink bg-ink-deep">
          <img src="/juego/logo.jpg" alt="" className="h-full w-full object-contain" />
        </div>
      </div>
    </div>
  );
}
