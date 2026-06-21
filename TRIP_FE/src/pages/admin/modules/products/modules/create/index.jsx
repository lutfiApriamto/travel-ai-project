import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../../../../../utils/consts/routes.js';
import { useCreateProduct } from '../../api/useProducts.js';
import ProductForm from '../../components/ProductForm.jsx';

const ProductCreatePage = () => {
  const navigate = useNavigate();
  const { mutate: create, isPending } = useCreateProduct();

  const handleSubmit = (data) => {
    // Clean up empty optional numbers
    const cleaned = {
      ...data,
      minParticipants: data.minParticipants || undefined,
      thumbnail:       data.thumbnail       || undefined,
    };
    create(cleaned, {
      onSuccess: (product) => navigate(ROUTES.ADMIN.PRODUCT_DETAIL(product._id)),
    });
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.ADMIN.PRODUCTS)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border
            text-muted-foreground hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-bold text-foreground text-xl">Tambah Produk</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Buat paket wisata baru</p>
        </div>
      </div>

      <ProductForm onSubmit={handleSubmit} isLoading={isPending} isEdit={false} />
    </div>
  );
};

export default ProductCreatePage;
