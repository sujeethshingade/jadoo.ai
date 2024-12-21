import Link from 'next/link'
import Image from 'next/image'
import Gif404 from '@/assets/dhoop-jadu.gif'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="text-center space-y-6">
                <Image
                    src={Gif404}
                    alt="404 Animation"
                    width={300}
                    height={300}
                    className="mx-auto rounded-md"
                />

                <h1 className="text-6xl font-bold text-white">
                    oops! 404
                </h1>

                <p className="text-xl text-white">
                    Looks like you've found Jadoo!
                </p>

                <Link
                    href="/"
                    className="inline-block px-4 py-2 text-sm text-white bg-transparent rounded-md border border-white/10
                    hover:bg-white/15 transition duration-300"
                >
                    Home
                </Link>
            </div>
        </div>
    )
}