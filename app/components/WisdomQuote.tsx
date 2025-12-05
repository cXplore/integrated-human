export default function WisdomQuote() {
  const quotes = [
    {
      text: "Nature loves courage. You make the commitment and nature will respond to that commitment by removing impossible obstacles.",
      author: "Terence McKenna",
    },
    {
      text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.",
      author: "Alan Watts",
    },
    {
      text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.",
      author: "Carl Jung",
    },
    {
      text: "We live together, we act on, and react to, one another; but always and in all circumstances we are by ourselves.",
      author: "Aldous Huxley",
    },
    {
      text: "People don't have ideas. Ideas have people.",
      author: "Carl Jung",
    },
    {
      text: "You are under no obligation to be the same person you were five minutes ago.",
      author: "Alan Watts",
    },
    {
      text: "The cost of sanity in this society is a certain level of alienation.",
      author: "Terence McKenna",
    },
    {
      text: "Knowing your own darkness is the best method for dealing with the darknesses of other people.",
      author: "Carl Jung",
    },
  ];

  // Rotate quote based on day of year (simple deterministic rotation)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const quote = quotes[dayOfYear % quotes.length];

  return (
    <div className="bg-stone-900 text-stone-100 py-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <blockquote className="font-serif text-2xl md:text-3xl font-light leading-relaxed mb-6 italic">
          "{quote.text}"
        </blockquote>
        <cite className="text-stone-400 text-sm uppercase tracking-wide not-italic">
          — {quote.author}
        </cite>
      </div>
    </div>
  );
}
