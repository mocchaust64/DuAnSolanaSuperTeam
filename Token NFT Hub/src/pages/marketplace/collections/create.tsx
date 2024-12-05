import type { NextPage } from 'next';
import { CreateCollection } from '../../../components/marketplace/collections/CreateCollection';
import { MarketplaceAppBar } from '../../../components/marketplace/MarketplaceAppBar';

const CreateCollectionPage = () => {
  return (
    <MarketplaceAppBar>
      <div className="container mx-auto px-4 py-8">
       
        <CreateCollection />
      </div>
    </MarketplaceAppBar>
  );
};

export default CreateCollectionPage;