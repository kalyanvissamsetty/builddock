import localFont from "next/font/local";

export const avenir = localFont({
    variable: "--font-avenir",
    src: [
        {
            path: "./avenir/AvenirLTStd-Black.otf",
            weight: "900",
            style: "normal",
        },
        {
            path: "./avenir/AvenirLTStd-Light.otf",
            weight: "300",
            style: "normal",
        },
        {
            path: "./avenir/AvenirLTStd-Roman.otf",
            weight: "400",
            style: "normal",
        },

    ],
});