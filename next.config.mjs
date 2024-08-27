/** @type {import('next').NextConfig} */
// const nextConfig = { reactStrictMode: true, };

const nextConfig = {
    output: 'export',
    basePath: '/substitution-rules',
    assetPrefix: '/substitution-rules/',
    publicRuntimeConfig: {
        basePath: '/substitution-rules',
    },
};


export default nextConfig;
