import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
    allowedDevOrigins: [
        "app.gabemcwilliams.internal",
        "api.gabemcwilliams.internal",
         "gabemcwilliams.internal",

        "192.168.55.11",
        "192.168.55.12",
        "192.168.55.13",

        "localhost",
        "127.0.0.1",
    ],

    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
