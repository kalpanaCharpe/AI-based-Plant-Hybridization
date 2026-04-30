import { Link } from 'react-router-dom'

const features = [
  { icon: '🧬', title: 'AI-Powered Genetics', desc: 'Our ML model analyzes thousands of plant genotypes to predict accurate hybrid traits.' },
  { icon: '🌿', title: 'Rich Plant Database', desc: 'Access hundreds of plant species with detailed botanical profiles and genetic data.' },
  { icon: '📊', title: 'Detailed Trait Analysis', desc: 'Get predictions on height, yield, disease resistance, climate adaptability, and more.' },
  { icon: '📜', title: 'Prediction History', desc: 'Track all your past predictions and compare hybrid outcomes over time.' },
]

const stats = [
  { value: '500+', label: 'Plant Species' },
  { value: '95%', label: 'Prediction Accuracy' },
  { value: '10K+', label: 'Hybrids Predicted' },
  { value: '7', label: 'Trait Parameters' },
]

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-forest-800/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 relative">
          <div className="max-w-3xl">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-6 mt-6">
              <span className="text-forest-400">An Intelligent Prediction System </span>
              <span className="text-3xl">for a new hybrid plant variety from datasets</span>
            </h1>
            <p className="text-forest-200/80 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl">
              Select two parent plants and let our machine learning model predict the traits of their hybrid offspring — height, flower color, yield, disease resistance, and more.
            </p>
          </div>
        </div>

        {/* Floating plant emoji */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 text-8xl animate-float hidden lg:block select-none pointer-events-none">
          🌿
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-sage-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-sage-100">
            {stats.map((s) => (
              <div key={s.label} className="text-center py-4 md:py-0">
                <div className="font-display text-3xl md:text-4xl font-black text-forest-600">{s.value}</div>
                <div className="text-sage-500 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-organic py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-forest-600 font-semibold text-sm uppercase tracking-widest mb-3">Why HybridFlora</p>
            <h2 className="section-title">Botanical Intelligence<br />at Your Fingertips</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="card hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-4xl mb-4 text-center">{f.icon}</div>
                <h3 className="font-display font-bold text-sage-900 text-lg mb-2">{f.title}</h3>
                <p className="text-sage-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="section-title">How It Works</h2>
            <p className="text-sage-500 mt-3">Simple 3-step process to predict your hybrid plant</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {[
              { step: '01', title: 'Select Parents', desc: 'Choose two parent plants from our database using the dropdowns.', icon: '🌱' },
              { step: '02', title: 'AI Prediction', desc: 'Our ML model analyzes genetic compatibility and predicts hybrid traits.', icon: '🤖' },
              { step: '03', title: 'View Results', desc: 'Get a detailed breakdown of all predicted traits for the hybrid plant.', icon: '📊' },
            ].map((item, i) => (
              <div key={item.step} className="flex flex-col md:flex-row items-center gap-6 flex-1">
                <div className="flex flex-col items-center text-center gap-3 flex-1">
                  <div className="w-16 h-16 bg-forest-50 border-2 border-forest-200 rounded-2xl flex items-center justify-center text-3xl">
                    {item.icon}
                  </div>
                  <div className="font-mono text-xs font-bold text-forest-400 tracking-widest">{item.step}</div>
                  <h3 className="font-display font-bold text-sage-900">{item.title}</h3>
                  <p className="text-sage-500 text-sm">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block text-sage-300 text-3xl flex-shrink-0">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest-950 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to create your hybrid?
          </h2>
          <p className="text-forest-300 mb-8">
            Join thousands of researchers and farmers using HybridFlora to advance botanical science.
          </p>
          <Link to="/predict" className="btn-primary text-base py-2 px-6 inline-block shadow-xl shadow-forest-900/50">
            Start Now
          </Link>
        </div>
      </section>
    </div>
  )
}
