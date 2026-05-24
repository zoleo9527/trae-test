import { useState } from 'react';
import { X, QrCode, Camera, Upload } from 'lucide-react';

export default function ScanModal({ open, onClose }) {
  const [scanMode, setScanMode] = useState('camera');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <QrCode className="w-5 h-5 mr-2 text-primary-600" />
            扫码录入
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setScanMode('camera')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              scanMode === 'camera' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-4 h-4 inline mr-2" />
            相机扫描
          </button>
          <button
            onClick={() => setScanMode('upload')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              scanMode === 'upload' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            上传图片
          </button>
        </div>

        {scanMode === 'camera' ? (
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Camera className="w-12 h-12 mx-auto mb-3" />
              <p className="text-sm">相机扫描功能模拟</p>
              <p className="text-xs mt-1">实际使用时将调用设备摄像头</p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-primary-500 rounded-lg opacity-50" />
            </div>
          </div>
        ) : (
          <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-primary-500 transition-colors cursor-pointer">
            <div className="text-center text-gray-400">
              <Upload className="w-12 h-12 mx-auto mb-3" />
              <p className="text-sm">点击或拖拽上传二维码图片</p>
              <p className="text-xs mt-1">支持 JPG、PNG 格式</p>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div className="font-medium mb-2">扫码功能说明：</div>
            <ul className="text-xs space-y-1 text-gray-500">
              <li>• 扫描工地现场二维码可快速定位对应项目</li>
              <li>• 支持扫描纸质变更单条码进行调档</li>
              <li>• 扫描结果可直接跳转至对应详情页面</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            模拟扫描成功
          </button>
        </div>
      </div>
    </div>
  );
}
