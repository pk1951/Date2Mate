import React, { useState, useEffect } from 'react';

const DailyQuote = () => {
  const [currentQuote, setCurrentQuote] = useState(0);

  const quotes = [
    {
      text: "Love is not about finding the perfect person, but about seeing an imperfect person perfectly.",
      author: "Sam Keen"
    },
    {
      text: "The best thing to hold onto in life is each other.",
      author: "Audrey Hepburn"
    },
    {
      text: "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.",
      author: "Maya Angelou"
    },
    {
      text: "Love is composed of a single soul inhabiting two bodies.",
      author: "Aristotle"
    },
    {
      text: "The greatest happiness of life is the conviction that we are loved; loved for ourselves, or rather, loved in spite of ourselves.",
      author: "Victor Hugo"
    },
    {
      text: "To love and be loved is to feel the sun from both sides.",
      author: "David Viscott"
    },
    {
      text: "Love is the master key that opens the gates of happiness.",
      author: "Oliver Wendell Holmes"
    },
    {
      text: "The best love is the kind that awakens the soul and makes us reach for more, that plants a fire in our hearts and brings peace to our minds.",
      author: "Nicholas Sparks"
    },
    {
      text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
      author: "1 Corinthians 13:4"
    },
    {
      text: "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed.",
      author: "Carl Jung"
    },
    {
      text: "Love is the bridge between you and everything.",
      author: "Rumi"
    },
    {
      text: "When you realize you want to spend the rest of your life with somebody, you want the rest of your life to start as soon as possible.",
      author: "Nora Ephron"
    },
    {
      text: "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.",
      author: "Anonymous"
    },
    {
      text: "The heart wants what it wants. There's no logic to these things. You meet someone and you fall in love and that's that.",
      author: "Woody Allen"
    },
    {
      text: "Love is the answer, and you know that for sure; Love is a flower, you've got to let it grow.",
      author: "John Lennon"
    }
  ];

  useEffect(() => {
    // Get current date to determine which quote to show
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % quotes.length;
    setCurrentQuote(quoteIndex);
  }, [quotes.length]);

  return (
    <div className="daily-quote-section">
      <div className="daily-quote">
        "{quotes[currentQuote].text}"
      </div>
      <div className="quote-author">
        — {quotes[currentQuote].author}
      </div>
    </div>
  );
};

export default DailyQuote; 