import Navigation from '../components/Navigation';

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-stone-50">
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-5xl md:text-6xl font-light text-stone-900 mb-12">
              About Integrated Human
            </h1>

            <div className="space-y-6 text-stone-700 leading-relaxed text-lg">
              <p>
                I'm not a guru, therapist, or enlightened master.
              </p>
              <p>
                I'm someone who's burned out, rebuilt, noticed the same patterns looping, and finally stopped pretending everything's figured out.
              </p>
              <p>
                This site started as notes to myself — scattered observations that didn't fit anywhere else.
              </p>
              <p>
                Notes on why my body would feel heavy even when life looked okay on paper.<br />
                Notes on why I could be strong in the gym but weak in my boundaries.<br />
                Notes on why some relationships burned bright and then collapsed under their own intensity.<br />
                Notes on how psychedelics could open the sky and still leave me confused the next morning.
              </p>
              <p>
                At some point I realised these notes weren't only for me.
              </p>
              <p>
                We live in a time where everything is split:
              </p>
              <p className="ml-4">
                – Fitness in one corner<br />
                – Therapy in another<br />
                – Spirituality in a third<br />
                – Dating advice somewhere between entertainment and manipulation
              </p>
              <p>
                Real life doesn't work like that.<br />
                Your deadlift, your childhood, your nervous system, your relationships and your idea of God all talk to each other – whether you're aware of it or not.
              </p>
              <p>
                "Integrated Human" is my attempt to stop separating what actually belongs together.
              </p>
              <p>
                Here you'll find:
              </p>
              <p className="ml-4">
                – <strong>Body:</strong> training, food, sleep, breath – the stuff that makes you feel solid in your own skin.<br />
                – <strong>Mind:</strong> psychology, attachment, shadow, masculine and feminine patterns, communication.<br />
                – <strong>Soul:</strong> wisdom, meditation, psychedelics, philosophy, the quiet part of you that knows when you're lying to yourself.<br />
                – <strong>Relationships:</strong> the arena where all of the above become very real, very fast.
              </p>
              <p>
                I write from the middle of the process, not from a mountaintop.
              </p>
              <p>
                Sometimes the tone will be sharp, sometimes soft.<br />
                Sometimes practical (do this, not that).<br />
                Sometimes more like sitting in silence with a friend after a hard night.
              </p>
              <p>
                If you're here, you probably recognise at least one of these:
              </p>
              <p className="ml-4">
                – You want strength that is more than appearance.<br />
                – You want honesty in your relationships, even when it hurts.<br />
                – You're tired of quick fixes but still hungry for change.<br />
                – You suspect that your body, mind and soul are not separate projects.
              </p>
              <p>
                If any of that lands, you're in the right place.
              </p>
              <p>
                I don't have all the answers.<br />
                But I'm committed to asking better questions, telling the truth as I see it, and sharing whatever I learn along the way.
              </p>
              <p className="pt-8 border-t border-stone-200 font-serif text-xl">
                Welcome to Integrated Human.
              </p>
              <p className="italic">
                Live stronger. Feel deeper. Become whole.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
