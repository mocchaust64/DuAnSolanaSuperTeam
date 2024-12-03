import { FC } from 'react';
import { useRouter } from 'next/router';
import { Collections } from './Collections';

const CollectionsPage: FC = () => {
  const router = useRouter();

  return (
    <div>
      {/* Navigation tabs */}
      <div className="flex space-x-4 mb-6 max-w-6xl mx-auto px-6">
        <button
          onClick={() => router.push('/marketplace/my-nfts')}
          className="px-4 py-2 text-gray-400 hover:text-white font-semibold border-b-2 border-transparent hover:border-purple-500"
        >
          My NFTs
        </button>
        <button
          className="px-4 py-2 text-white font-semibold border-b-2 border-purple-500"
        >
          Collections
        </button>
      </div>

      {/* Collections Component */}
      <Collections />
    </div>
  );
};

export default CollectionsPage;
