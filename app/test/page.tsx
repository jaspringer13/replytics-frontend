"use client"

export default function TestPage() {
  return (
    <div>
      <h1 className="text-6xl font-bold text-red-500 bg-yellow-300 p-10">
        TAILWIND TEST
      </h1>
      <div className="grid grid-cols-3 gap-4 p-8">
        <div className="bg-blue-500 text-white p-4 rounded-lg">Box 1</div>
        <div className="bg-green-500 text-white p-4 rounded-lg">Box 2</div>
        <div className="bg-purple-500 text-white p-4 rounded-lg">Box 3</div>
      </div>
      <p style={{ color: 'red', fontSize: '50px' }}>If this is red, inline styles work</p>
      
      {/* Additional diagnostic tests */}
      <div className="mt-8 p-4 border-4 border-dashed border-red-500">
        <p className="text-lg">Diagnostic Info:</p>
        <p>If you see a red dashed border, Tailwind utilities are working</p>
        <p className="text-brand-500 font-bold">This text should be teal (brand color)</p>
        <div className="w-32 h-32 bg-gradient-to-r from-brand-500 to-blue-500 mt-4"></div>
        <p className="mt-4">Above should be a gradient box</p>
      </div>
    </div>
  );
}