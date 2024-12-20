import StarIcon from "@/assets/star.svg";

const words = [
  "AI-Powered",
  "Image Recognition",
  "Object Detection",
  "Semantic Tagging",
  "Contextual Analysis",
  "Searchable",
  "User-Centric",
  "Enhanced Discoverability",
  "AI-Powered",
  "Image Recognition",
  "Object Detection",
  "Semantic Tagging",
  "Contextual Analysis",
  "Searchable",
  "User-Centric",
  "Enhanced Discoverability",  
];

export default function TapeSection() {
  return (
    <div className="py-16 lg:py-24 overflow-x-clip">
      <div className="bg-gradient-to-tr from-blue-900 to-emerald-500 -rotate-3 -mx-1">
        <div className="flex [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div
            className="flex flex-none gap-4 pr-4 py-3 animate-move-left [animation-duration:45s]">
            {words.map(word => (
              <div key={word} className="inline-flex gap-4 items-center">
                <span className="text-white uppercase font-bold text-sm">{word}</span>
                <StarIcon className="size-6 text-white -rotate-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
