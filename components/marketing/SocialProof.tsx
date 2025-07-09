export function SocialProof() {
  const companies = [
    "Bliss Hair Studio",
    "Ink Masters Tattoo",
    "Tranquil Waters Spa",
    "Elite Barbershop",
    "Nail Artistry",
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500 mb-8">Trusted by 1,000+ service businesses</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {companies.map((company) => (
            <div key={company} className="text-gray-400 font-semibold text-lg">
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}