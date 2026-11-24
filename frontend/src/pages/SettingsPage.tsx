import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'business' | 'receipt' | 'tax' | 'users' | 'backup'>('business');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-4">
            {[
              { id: 'business', name: 'Business Profile' },
              { id: 'receipt', name: 'Receipt Settings' },
              { id: 'tax', name: 'Tax Rules' },
              { id: 'users', name: 'Users & Roles' },
              { id: 'backup', name: 'Backup & Restore' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-4 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          {activeTab === 'business' && (
            <BusinessSettingsForm />
          )}
          {activeTab === 'receipt' && (
            <ReceiptSettingsForm />
          )}
          {activeTab === 'tax' && (
            <TaxSettingsForm />
          )}
          {activeTab === 'users' && (
            <UsersSettings />
          )}
          {activeTab === 'backup' && (
            <BackupSettings />
          )}
        </div>
      </div>
    </div>
  );
}

function BusinessSettingsForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Business Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
          <input
            type="text"
            defaultValue="Local Grocery Store"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
            <option>LKR - Sri Lankan Rupee</option>
            <option>USD - US Dollar</option>
            <option>EUR - Euro</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          defaultValue="123 Main Street, Colombo"
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            defaultValue="011-1234567"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label>
          <input
            type="text"
            defaultValue="123456789V"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Save className="h-5 w-5 mr-2" />
        Save Changes
      </button>
    </div>
  );
}

function ReceiptSettingsForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Receipt Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Width</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
            <option value="58">58mm (Thermal)</option>
            <option value="80">80mm (Thermal)</option>
            <option value="A4">A4</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Header Text</label>
          <input
            type="text"
            defaultValue="Local Grocery Store"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
        <input
          type="text"
          defaultValue="Thank you for shopping!"
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Show Logo</label>
          <div className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm text-gray-600">Enable</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Show QR Code</label>
          <div className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm text-gray-600">Enable</span>
          </div>
        </div>
      </div>

      <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Save className="h-5 w-5 mr-2" />
        Save Changes
      </button>
    </div>
  );
}

function TaxSettingsForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Tax Configuration</h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">⚠️ Feature coming in Phase 3</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
          <input
            type="number"
            defaultValue="0"
            step="0.01"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="flex items-center">
            <input type="checkbox" defaultChecked className="w-4 h-4 mr-2" />
            <span className="text-sm text-gray-700">Tax included in prices</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rates by Category</label>
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-2" />
            <p>Configure per-category tax rates</p>
          </div>
        </div>
      </div>

      <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Save className="h-5 w-5 mr-2" />
        Save Changes
      </button>
    </div>
  );
}

function UsersSettings() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Users & Access</h2>

      <div className="text-center py-8 text-gray-500">
        <Shield className="h-12 w-12 mx-auto mb-2" />
        <p>Manage users, roles, and permissions</p>
        <p className="text-sm mt-1">Feature coming in Phase 4</p>
      </div>
    </div>
  );
}

function BackupSettings() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Backup & Restore</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Automatic Backup</h3>
            <p className="text-sm text-gray-600">Daily database backup</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only" />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bs-blue-600 peer-checked:border-blue-600"></div>
          </label>
        </div>

        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
          <RefreshCw className="h-5 w-5 mr-2" />
          Create Manual Backup
        </button>

        <button className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50">
          <Shield className="h-5 w-5 mr-2" />
          Restore from Backup
        </button>
      </div>

      <div className="text-xs text-gray-500 mt-4">
        <p>Backup location: Persistent volume in Docker</p>
        <p>Backup interval: Every 24 hours</p>
      </div>
    </div>
  );
}