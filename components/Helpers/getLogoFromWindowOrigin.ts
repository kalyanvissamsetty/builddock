import type { StaticImageData } from "next/image";

import mosaicLogo from "@/public/logos/mosaiclogo.png";
import timsLogo from "@/public/logos/timslogo.png";

export function getLogoFromWindowOrigin(): StaticImageData {
    if (typeof window === "undefined") {
        return mosaicLogo;
    }

    if (window.origin.includes("themosaiccompany")) {
        return mosaicLogo;
    }

    if (window.origin.includes("timsstudio")) {
        return timsLogo;
    }

    return mosaicLogo;
}