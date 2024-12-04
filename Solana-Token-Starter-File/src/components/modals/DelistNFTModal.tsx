import { FC } from 'react';
import { NFT } from '@/types/nft';

interface DelistModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: NFT | null;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export const DelistNFTModal: FC<DelistModalProps> = ({ 
  isOpen, 
  onClose, 
  nft, 
  onConfirm, 
  loading 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="font-bold text-lg text-white mb-4">
          Delist NFT
        </h3>

        {nft && (
          <div className="mb-6">
            <div className="aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden mb-4">
              <img
                src={nft.image || '/assets/images/logo11.png'}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="space-y-2 text-white">
              <h3 className="font-bold">{nft.name}</h3>
              {nft.description && (
                <p className="text-sm text-gray-400">
                  {nft.description}
                </p>
              )}
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-medium">Listing Details:</p>
                <p className="text-sm text-gray-400">
                  Price: {nft.price ? 
                    `${nft.price} SOL` : 
                    'Not listed'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-gray-400 mb-6">
          Bạn có chắc chắn muốn delist NFT này không?
        </p>

        <div className="modal-action">
          <button
            onClick={onClose}
            className="btn btn-ghost"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-error"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận Delist'}
          </button>
        </div>
      </div>
    </div>
  );
};
