interface MemoryBubbleProps {
    name: string;
    story: string;
    position: {
      top?: string;
      left?: string;
      right?: string;
      bottom?: string;
    };
  }
  
  export function MemoryBubble({ name, story, position }: MemoryBubbleProps) {
    return (
      <div
        className="absolute opacity-10 hover:opacity-100 transition-opacity duration-300"
        style={position}
      >
        <div className="bg-transparent p-4 rounded-md max-w-[200px]">
          <p className="text-white/70 font-medium mb-1">{name}</p>
          <p className="text-white/70 text-sm">{story}</p>
        </div>
      </div>
    );
  }