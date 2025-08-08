import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../auth/AuthProvider';

interface FileUploadProps {
  onUploadSuccess?: (paperId: string) => void;
  onUploadError?: (error: string) => void;
}

export function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock implementation for testing
  const getUploadUrl = {
    mutateAsync: async (input: { fileName: string; contentType: string }) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
             const paperId = `paper_${Date.now()}`;
       const uploadUrl = `mock://storage.googleapis.com/upload/${paperId}/${input.fileName}`;
      
      return {
        uploadUrl,
        paperId,
      };
    },
    error: null
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      onUploadError?.('You must be logged in to upload files');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      onUploadError?.('Only PDF files are supported');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onUploadError?.('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Get presigned URL
      const { paperId } = await getUploadUrl.mutateAsync({
        fileName: file.name,
        contentType: file.type,
      });

             // Mock upload simulation
       const simulateUpload = () => {
         let progress = 0;
         const interval = setInterval(() => {
           progress += Math.random() * 20 + 10; // Random progress increments
           if (progress >= 100) {
             progress = 100;
             clearInterval(interval);
             setUploadProgress(100);
             
                           // Simulate successful upload and processing
              setTimeout(() => {
                onUploadSuccess?.(paperId);
                setIsUploading(false);
                
                // Simulate document processing completion after a delay
                setTimeout(() => {
                  console.log(`Document ${paperId} processing completed`);
                }, 3000);
              }, 500);
           } else {
             setUploadProgress(progress);
           }
         }, 200);
       };

       simulateUpload();

    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
      setIsUploading(false);
    }
  }, [user, getUploadUrl, onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isUploading
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <p className="text-lg font-medium text-gray-900">Uploading PDF...</p>
              <p className="text-sm text-gray-600">Please wait while we process your file</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{Math.round(uploadProgress)}% complete</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your PDF here' : 'Upload a PDF document'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Drag and drop your PDF file here, or click to browse
              </p>
            </div>
            
            <div className="text-xs text-gray-500">
              <p>Supported format: PDF only</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </div>
        )}
      </div>

      {getUploadUrl.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            Error: Upload failed
          </p>
        </div>
      )}
    </div>
  );
} 