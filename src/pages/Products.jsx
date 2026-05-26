import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  truncateText
} from '../utils/format';

export default function Products({ user }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetail, setProductDetail] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    keyword: ''
  });

  const categories = ['绿茶', '乌龙茶', '白茶', '普洱茶', '红茶'];

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.keyword) params.keyword = filters.keyword;
      
      const data = await api.products.list(params);
      setProducts(data);
    } catch (err) {
      console.error('加载产品数据失败:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadProductDetail(id) {
    try {
      const data = await api.products.get(id);
      setProductDetail(data);
      setSelectedProduct(id);
    } catch (err) {
      console.error('加载产品详情失败:', err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilters({ ...filters, category: '' })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !filters.category
                ? 'bg-tea-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilters({ ...filters, category: cat })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.category === cat
                  ? 'bg-tea-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="搜索产品名称/SKU..."
          className="input input-sm w-full sm:w-64"
          value={filters.keyword}
          onChange={e => setFilters({ ...filters, keyword: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>产品名称</th>
                    <th>分类</th>
                    <th>规格</th>
                    <th className="text-right">参考单价</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">加载中...</td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">暂无产品数据</td>
                    </tr>
                  ) : (
                    products.map((product, idx) => (
                      <tr
                        key={idx}
                        className={`cursor-pointer ${
                          selectedProduct === product.id ? 'bg-tea-50' : ''
                        }`}
                        onClick={() => loadProductDetail(product.id)}
                      >
                        <td className="font-mono text-sm text-tea-600">{product.sku}</td>
                        <td className="font-medium text-gray-800">{product.name}</td>
                        <td>
                          <span className="badge badge-info">{product.category}</span>
                        </td>
                        <td className="text-gray-600">{product.spec}</td>
                        <td className="text-right font-medium text-gray-800">
                          {formatCurrency(product.base_price)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          {productDetail ? (
            <div className="card sticky top-6">
              <div className="card-header">
                <h3 className="font-semibold text-gray-800">产品详情</h3>
                <button
                  onClick={() => { setSelectedProduct(null); setProductDetail(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">产品名称</p>
                  <p className="font-semibold text-gray-800 text-lg">{productDetail.product.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">SKU</p>
                    <p className="font-mono text-tea-600">{productDetail.product.sku}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">分类</p>
                    <p className="font-medium">{productDetail.product.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">规格</p>
                    <p className="font-medium">{productDetail.product.spec}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">参考单价</p>
                    <p className="font-semibold text-tea-600">{formatCurrency(productDetail.product.base_price)}</p>
                  </div>
                </div>
                {productDetail.product.description && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">产品描述</p>
                    <p className="text-gray-600 text-sm">{productDetail.product.description}</p>
                  </div>
                )}

                {productDetail.batches.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">库存批次</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                      {productDetail.batches.map((batch, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono text-xs text-tea-600">{batch.batch_no}</span>
                            <span className="text-sm font-medium">{formatNumber(batch.available_quantity)} {productDetail.product.unit}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{batch.warehouse_name}</span>
                            <span>到期: {formatDate(batch.expiry_date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {productDetail.priceHistory.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">价格调整记录</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                      {productDetail.priceHistory.map((pa, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">
                              <span className="text-gray-500 line-through">{formatCurrency(pa.old_price)}</span>
                              <span className="mx-2">→</span>
                              <span className="font-medium text-tea-600">{formatCurrency(pa.new_price)}</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{pa.reason}</span>
                            <span>{formatDate(pa.effective_date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🍵</div>
                <p>点击左侧产品查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
