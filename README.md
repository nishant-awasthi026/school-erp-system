This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

uploaded profile image is not showing ,i want to migrate backend static data storage to imagekit 

ImagekitID: mpswbagub
URL-endpoint: https://ik.imagekit.io/mpswbagub
pulic key : public_mFy/A7hYYFFbBTz98R3neYs8Ulk=
private key: private_KvDfB20MtS0C8gDAykGo9TQ8UQ8=

Trajectory ID: a4b5113c-8162-4870-8ef9-3d20c2b92bfa
Error: HTTP 503 Service Unavailable
Sherlog: 
TraceID: 0x4a775658b04aa35b
Headers: {"Alt-Svc":["h3=\":443\"; ma=2592000,h3-29=\":443\"; ma=2592000"],"Content-Length":["524"],"Content-Type":["text/event-stream"],"Date":["Fri, 27 Mar 2026 13:23:52 GMT"],"Server":["ESF"],"Server-Timing":["gfet4t7; dur=769"],"Vary":["Origin","X-Origin","Referer"],"X-Cloudaicompanion-Trace-Id":["4a775658b04aa35b"],"X-Content-Type-Options":["nosniff"],"X-Frame-Options":["SAMEORIGIN"],"X-Xss-Protection":["0"]}

{
  "error": {
    "code": 503,
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "domain": "cloudcode-pa.googleapis.com",
        "metadata": {
          "model": "gemini-3.1-pro-high"
        },
        "reason": "MODEL_CAPACITY_EXHAUSTED"
      },
      {
        "@type": "type.googleapis.com/google.rpc.RetryInfo",
        "retryDelay": "7s"
      }
    ],
    "message": "No capacity available for model gemini-3.1-pro-high on the server",
    "status": "UNAVAILABLE"
  }
}