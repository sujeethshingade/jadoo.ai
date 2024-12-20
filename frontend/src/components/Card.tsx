import { twMerge } from "tailwind-merge";
import { PropsWithChildren } from "react";

export const Card = ({ className, children }: PropsWithChildren<{
    className?: string;
}>) => {
    return (
        <div className={twMerge("bg-transparent rounded-3xl relative z-0 overflow-hidden after:z-10 after:content-[''] after:absolute after:inset-0 after:outline after:outline-2 after:-outline-offset-2 after:rounded-3xl after:outline-white/10 after:pointer-events-none p-6", className)}>
            <div className="absolute inset-0 -z-10 opacity-5">
            </div>
            {children}
        </div>
    );
};