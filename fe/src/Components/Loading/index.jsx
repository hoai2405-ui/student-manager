import { Spin, Skeleton } from 'antd';
import { createContext, useContext, useState } from 'react';
import { AnimatePresence } from 'framer-motion';

const LoadingContext = createContext(undefined);

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Đang tải...');

  const showLoading = (text = 'Đang tải...') => {
    setLoadingText(text);
    setLoading(true);
  };
  const hideLoading = () => setLoading(false);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, setLoadingText }}>
      {children}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
            >
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderTop: '3px solid #fff',
                    borderRadius: '50%',
                    position: 'absolute'
                  }}
                />
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  style={{
                    fontSize: 24,
                    color: '#fff',
                    fontWeight: 600,
                    zIndex: 1
                  }}
                >
                  ⌛
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{
                textAlign: 'center',
                color: '#666',
                fontSize: 16,
                fontWeight: 500
              }}
            >
              {loadingText}
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              style={{
                width: 200,
                height: 3,
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <motion.div
                animate={{ x: ['0%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: '50%',
                  height: '100%',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: 2
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
};

// Skeleton Loading Components
export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <div style={{ padding: 16 }}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} style={{
        display: 'flex',
        gap: 16,
        marginBottom: 16,
        padding: '12px 0',
        borderBottom: '1px solid #f0f0f0'
      }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton.Input
            key={colIndex}
            active
            size="small"
            style={{
              width: colIndex === 0 ? 60 : colIndex === 1 ? 150 : 100,
              minWidth: colIndex === 0 ? 60 : colIndex === 1 ? 150 : 100
            }}
          />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = ({ count = 4 }) => (
  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} style={{ flex: '1 1 300px', minWidth: 250 }}>
        <Skeleton.Input active style={{ width: '100%', height: 120, borderRadius: 16 }} />
      </div>
    ))}
  </div>
);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
