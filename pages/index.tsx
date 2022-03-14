import { Button } from "@mui/material";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

const Page: NextPage = () => {
  return (
    <div>
      <Head>
        <title>barnard59</title>
        <meta name="description" content="Create pipelines using barnard59" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Barnard59</h1>
        <p>Create nice pipelines</p>
        <Link href="/package" passHref>
          <Button variant="contained" size="large">
            Browse packages
          </Button>
        </Link>
      </main>
    </div>
  );
};

export default Page;
