export default function DisclaimerFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 bg-[#F0F3F7] border-t border-[#E8ECF2] px-6 py-[10px]">
      <p className="text-[11px] font-medium text-[#9FADBF] text-center leading-[1.5]">
        For informational purposes only. ClearBet does not provide financial, betting, or investment advice. Bet responsibly.{" "}
        |{" "}
        Get help:{" "}
        <a
          href="https://www.ncpgambling.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#637A96] transition-colors"
        >
          ncpgambling.org
        </a>
      </p>
    </footer>
  );
}
