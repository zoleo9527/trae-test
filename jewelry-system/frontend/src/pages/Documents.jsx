import { useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  Folder,
  Eye,
  Clock,
  User
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

const documentCategories = [
  { id: 'all', label: '全部文件' },
  { id: 'personal', label: '个人材料' },
  { id: 'academic', label: '学术材料' },
  { id: 'financial', label: '资金证明' },
  { id: 'visa', label: '签证相关' }
];

const mockDocuments = [
  { id: 'D001', name: '护照扫描件.pdf', category: 'personal', student: '李思琪', size: '2.3 MB', uploadedAt: '2024-01-10', uploader: '王顾问' },
  { id: 'D002', name: '成绩单.pdf', category: 'academic', student: '王浩然', size: '1.5 MB', uploadedAt: '2024-01-12', uploader: '陈顾问' },
  { id: 'D003', name: '存款证明.pdf', category: 'financial', student: '陈雨萱', size: '890 KB', uploadedAt: '2024-01-15', uploader: '李文案' },
  { id: 'D004', name: '在读证明.pdf', category: 'academic', student: '刘子轩', size: '1.2 MB', uploadedAt: '2024-01-18', uploader: '张助理' },
  { id: 'D005', name: '学习计划.pdf', category: 'visa', student: '赵欣怡', size: '3.1 MB', uploadedAt: '2024-01-20', uploader: '刘文案' },
  { id: 'D006', name: '语言成绩.pdf', category: 'academic', student: '孙浩然', size: '450 KB', uploadedAt: '2024-01-22', uploader: '陈顾问' }
];

export default function Documents() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.student.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 flex-shrink-0">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-4">文件分类</h3>
            <nav className="space-y-1">
              {documentCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索文件名或学生..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>筛选</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">按上传时间</button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">按文件大小</button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">按文件名称</button>
                  </div>
                )}
              </div>
              
              <button className="btn-primary flex items-center gap-2">
                <Upload className="w-4 h-4" />
                上传文件
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            {filteredDocuments.length === 0 ? (
              <EmptyState
                icon="noData"
                title="暂无文件"
                description="该分类下还没有上传任何文件"
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredDocuments.map(doc => (
                  <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-500" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                          <span className="text-xs text-gray-400">{doc.size}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>学生: {doc.student}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {doc.uploadedAt}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {doc.uploader}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
