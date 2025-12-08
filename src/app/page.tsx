import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dealbox</h1>
          <Link
            href="/login"
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="text-center py-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Local Restaurant Deals
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get verified, guaranteed discounts at your favorite local restaurants.
            No catches, no fine print.
          </p>
          <Link
            href="/login"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-indigo-700 transition-colors"
          >
            Get Started
          </Link>
        </section>

        <section className="py-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold text-lg mb-2">Browse Restaurants</h4>
              <p className="text-gray-600">
                Explore local restaurants and their exclusive offers
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold text-lg mb-2">Get Your Coupon</h4>
              <p className="text-gray-600">
                Generate a single-use coupon code for your chosen offer
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold text-lg mb-2">Redeem & Save</h4>
              <p className="text-gray-600">
                Show your code at the restaurant and enjoy your discount
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p className="mb-4">Dealbox - Local Restaurant Discounts</p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/restaurant/login" className="hover:text-indigo-600">
              Restaurant Partner Login
            </Link>
            <Link href="/admin/login" className="hover:text-indigo-600">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
