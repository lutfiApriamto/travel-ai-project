import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ROUTES } from '../../../../../../utils/consts/routes.js';
import { useProduct, useUpdateProduct } from '../../api/useProducts.js';
import ProductForm, { toDateInput } from '../../components/ProductForm.jsx';

const ProductEditPage = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { data: product, isLoading } = useProduct(id);
  const { mutate: update, isPending } = useUpdateProduct();

  const handleSubmit = (data) => {
    const cleaned = {
      ...data,
      minParticipants: data.minParticipants || undefined,
      thumbnail:       data.thumbnail       || undefined,
    };
    update({ id, ...cleaned }, {
      onSuccess: () => navigate(ROUTES.ADMIN.PRODUCT_DETAIL(id)),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-travia-orange animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Produk tidak ditemukan</p>
      </div>
    );
  }

  // Build defaultValues — map populated objects to ID strings, format dates
  const defaultValues = {
    name:             product.name,
    shortDescription: product.shortDescription ?? '',
    description:      product.description      ?? '',
    categories:       product.categories.map(c => c._id ?? c),
    types:            product.types.map(t => t._id ?? t),
    tags:             product.tags.map(t => t._id ?? t),
    departureDate:    toDateInput(product.departureDate),
    returnDate:       toDateInput(product.returnDate),
    departureCity:    product.departureCity  ?? '',
    destinations:     product.destinations   ?? [],
    meetingPoint:     product.meetingPoint   ?? '',
    price:            product.price,
    quota:            product.quota,
    minParticipants:  product.minParticipants ?? '',
    thumbnail:        product.thumbnail      ?? '',
    gallery:          product.gallery        ?? [],
    itinerary:        product.itinerary      ?? [],
    includes:         product.includes       ?? [],
    excludes:         product.excludes       ?? [],
    addOns:           product.addOns         ?? [],
    terms:            product.terms          ?? '',
    status:           product.status,
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.ADMIN.PRODUCT_DETAIL(id))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border
            text-muted-foreground hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-bold text-foreground text-xl">Edit Produk</h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-sm">{product.name}</p>
        </div>
      </div>

      <ProductForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isLoading={isPending}
        isEdit={true}
      />
    </div>
  );
};

export default ProductEditPage;
