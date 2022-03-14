import type { NextPage } from "next";
import Head from "next/head";
import { PackageList, default as packageLists } from "../../lib/lists";

type Props = {
  name: string;
  list: PackageList;
};

const Page: NextPage<Props> = ({ name, list }) => {
  const title = `barnard59 - ${name} packages`;
  const description =
    list?.description || `barnard59 packages for the ${name} list`;

  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>{name} packages</h1>
        {list?.description && <p>{list.description}</p>}
      </main>

      <footer>
        <p></p>
      </footer>
    </div>
  );
};

export async function getStaticProps(context: any) {
  const name = context.params.name;
  const list = packageLists[name];
  return {
    props: {
      name,
      list,
    },
  };
}

export async function getStaticPaths() {
  const paths = Object.keys(packageLists).map((name) => {
    return {
      params: {
        name,
      },
    };
  });
  return {
    paths,
    fallback: false, // false or 'blocking'
  };
}

export default Page;
