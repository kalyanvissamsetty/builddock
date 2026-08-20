"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import {
    DOMAIN_LABELS,
    getAllowedDomains,
    getDefaultRouteForDomain,
    persistSelectedDomain,
} from "@/components/auth/domain";
import type { ReviewDomain } from "@/types";

type Profile = {
    id: ReviewDomain;
    name: string;
    eyebrow: string;
    description: string;
    href: string;
    imageSrc: string;
    accent: string;
    surface: string;
};

const PROFILES: Profile[] = [
    {
        id: "WEBGL",
        name: DOMAIN_LABELS.WEBGL,
        eyebrow: "Interactive Builds",
        description: "Enter the review space for playable builds, version checks, environment access, and WebGL feedback loops.",
        href: "/allbuilds",
        imageSrc: "/profile-icons/unity-webgl-review.png",
        accent: "#2563eb",
        surface: "#eff6ff",
    },
    {
        id: "GRAPHICS",
        name: DOMAIN_LABELS.GRAPHICS,
        eyebrow: "Artwork Flow",
        description: "Enter the review space for artwork uploads, version comments, ticket status, and visual approvals.",
        href: "/viewtickets",
        imageSrc: "/profile-icons/graphic-review.png",
        accent: "#e11d48",
        surface: "#fff1f2",
    },
];

export function getGreetingName(
    name: string | null | undefined,
    email: string | undefined
) {
    const fallback = "there";
    const source = name?.trim() || email?.split("@")[0] || fallback;

    const formattedSource = source.replace(/[._-]+/g, " ").trim();

    return formattedSource
        ? formattedSource.charAt(0).toUpperCase() + formattedSource.slice(1)
        : fallback;
}

function ProfileCard({ profile, href }: { profile: Profile; href: string }) {
    const router = useRouter();
    const [cardMotion, setCardMotion] = React.useState({
        rotateX: 0,
        rotateY: 0,
        x: 50,
        y: 50,
    });

    function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
        if (event.pointerType === "touch") return;

        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        setCardMotion({
            rotateX: ((y - 50) / 50) * -3,
            rotateY: ((x - 50) / 50) * 4,
            x,
            y,
        });
    }

    function resetCardMotion() {
        setCardMotion({
            rotateX: 0,
            rotateY: 0,
            x: 50,
            y: 50,
        });
    }

    return (
        <button
            type="button"
            className="group relative flex w-full overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-300 hover:border-zinc-300 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 sm:p-5"
            style={{
                transform: `perspective(900px) rotateX(${cardMotion.rotateX}deg) rotateY(${cardMotion.rotateY}deg)`,
            }}
            onPointerMove={handlePointerMove}
            onPointerLeave={resetCardMotion}
            onClick={() => {
                persistSelectedDomain(profile.id);
                router.push(href);
            }}
        >
            <span
                className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(circle at ${cardMotion.x}% ${cardMotion.y}%, ${profile.accent}1c 0, transparent 13rem)`,
                }}
            />
            <span
                className="absolute -right-20 -top-20 h-52 w-52 rounded-full opacity-80 transition duration-500 group-hover:scale-125"
                style={{ backgroundColor: profile.surface }}
            />
            <span
                className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full"
                style={{ backgroundColor: profile.accent }}
            />

            <span className="relative flex w-full flex-col gap-6">
                <span
                    className="relative overflow-hidden rounded-lg border p-4"
                    style={{
                        backgroundColor: profile.surface,
                        borderColor: `${profile.accent}24`,
                    }}
                >
                    <span className="absolute -left-12 top-5 h-24 w-24 rounded-full bg-white/80 blur-xl transition duration-500 group-hover:translate-x-6" />
                    <span className="absolute -right-16 bottom-4 h-28 w-28 rounded-full bg-white/70 blur-2xl transition duration-500 group-hover:-translate-x-6" />
                    

                    <span
                        className="relative mx-auto my-6 flex h-24 w-24 items-center justify-center rounded-full border bg-white/60 shadow-sm transition duration-500 group-hover:-translate-y-1 group-hover:scale-105 sm:h-28 sm:w-28"
                        style={{
                            borderColor: `${profile.accent}26`,
                            boxShadow: `0 18px 50px ${profile.accent}18`,
                        }}
                    >
                        <span className="absolute inset-3 rounded-full border border-white transition duration-500 group-hover:inset-1" />
                        <Image
                            src={profile.imageSrc}
                            alt=""
                            width={224}
                            height={224}
                            className="relative h-16 w-16 object-contain drop-shadow-sm transition duration-500 group-hover:-rotate-3 group-hover:scale-110 sm:h-20 sm:w-20"
                        />
                    </span>
                </span>

                <span className="space-y-3 px-1 pt-1">
                    <span className="block text-xl font-semibold text-zinc-950 sm:text-2xl">
                        {profile.name}
                    </span>
                    <span className="block max-w-md text-sm leading-6 text-zinc-500">
                        {profile.description}
                    </span>
                </span>

                <span className="flex justify-center pt-1">
                    <span
                        className="flex items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:gap-3 group-hover:shadow-md"
                        style={{
                            backgroundColor: profile.accent,
                            minWidth: "8rem",
                            minHeight: "2.5rem",
                            padding: "0.625rem 1.25rem",
                        }}
                    >
                        Enter
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                </span>
            </span>
        </button>
    );
}

export default function ProfileSelectionPage() {
    const { me } = useAuth();
    const router = useRouter();
    const allowedDomains = React.useMemo(() => getAllowedDomains(me), [me]);
    const profiles = React.useMemo(
        () => PROFILES.filter((profile) => allowedDomains.includes(profile.id)),
        [allowedDomains],
    );
    const greetingName = React.useMemo(() => getGreetingName(me?.name, me?.email), [me]);

    React.useEffect(() => {
        if (!me || allowedDomains.length !== 1) return;
        const onlyDomain = allowedDomains[0];
        persistSelectedDomain(onlyDomain);
        router.replace(getDefaultRouteForDomain(me, onlyDomain));
    }, [allowedDomains, me, router]);

    if (!me || allowedDomains.length <= 1) return null;

    return (
        <main
            className="overflow-auto px-4 py-6 text-zinc-950 sm:px-8 sm:py-8"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                width: "100vw",
                minHeight: "100dvh",
                background: "radial-gradient(circle at 50% 0%, #f4f4f5 0, #ffffff 34rem)",
            }}
        >
            <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col items-center justify-center gap-8 sm:min-h-[calc(100dvh-4rem)]">
                <div className="max-w-3xl space-y-3 text-center">
                    
                    <h1 className="text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
                        Hi {greetingName},
                        Where do you want to review today?
                    </h1>
                   
                </div>

                <div
                    className="grid p-10 w-full max-w-4xl gap-6 sm:grid-cols-2 sm:gap-10"
                >
                    {profiles.map((profile) => (
                        <ProfileCard
                            key={profile.id}
                            profile={profile}
                            href={getDefaultRouteForDomain(me, profile.id)}
                        />
                    ))}
                </div>
            </section>
        </main>
    );
}
