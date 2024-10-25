import { MdSubdirectoryArrowRight } from "react-icons/md";

export default async function Home() {
  return (
    <div className="font-[family-name:var(--font-primary)] grid place-items-center min-h-screen mx-auto container">
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex flex-col gap-2 text-gray-400">
        <h6 className="text-lg font-semibold text-gray-100 flex gap-3 items-center mb-2">
          Shorten an URL
        </h6>

        <form className="flex flex-col gap-[inherit]">
          <label className="bg-gray-800 rounded focus-within:text-gray-200 focus-within:border-gray-600 border-gray-700 border transition-colors flex items-center">
            <div className="p-2">
              <MdSubdirectoryArrowRight className="text-lg" />
            </div>
            <input
              type="text"
              name="url"
              placeholder="https://aparx.dev"
              className="block bg-transparent border-none outline-none placeholder-gray-300 placeholder-opacity-35"
            />
          </label>

          <button className="bg-gray-200 text-gray-900 font-bold py-1 px-3 rounded">
            Shorten
          </button>
        </form>
      </div>
    </div>
  );
}
