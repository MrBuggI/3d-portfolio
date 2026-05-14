import React, { useState, Suspense, useRef, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { TextureLoader, MeshStandardMaterial, NearestFilter, DoubleSide } from 'three';
import './App.css';

function OBJModel({ modelPath, texturePath, isCenter }) {
  const obj = useLoader(OBJLoader, modelPath);
  const texture = useLoader(TextureLoader, texturePath);
  const modelRef = useRef();
  
  useEffect(() => {
    if (obj && texture) {
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      texture.needsUpdate = true;
      
      obj.traverse((child) => {
        if (child.isMesh) {
          const material = new MeshStandardMaterial({
            map: texture,
            color: 0xffffff,
            alphaTest: 0.1, 
            roughness: 0.5,
            metalness: 0.05,
            transparent: false,
          });
          
          child.material = material;
          child.castShadow = true;
          child.receiveShadow = false;
        }
      });
    }
  }, [obj, texture]);

  return <primitive ref={modelRef} object={obj} scale={1} position={[0, -2.2, 0]} />;
}

function Fallback3DModel({ type, direction }) {
  const meshRef = useRef();
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (meshRef.current) {
        setRotation(prev => prev + 0.02);
        meshRef.current.rotation.y = rotation;
      }
    }, 16);
    return () => clearInterval(interval);
  }, [rotation]);
  
  let color = "#30e1b9";
  if (type === 'item') color = "#30e1b9";
  if (type === 'gui') color = "#30e1b9";
  
  return (
    <group>
      <mesh ref={meshRef} position={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.3} 
          metalness={0.1}
          side={DoubleSide}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 2, 2]} intensity={0.5} />
    </group>
  );
}

function ModelWrapper({ model, isCenter, direction }) {
  if (model.useObj) {
    return (
      <Suspense fallback={<Fallback3DModel type={model.type} direction={direction} />}>
        <OBJModel 
          modelPath={model.objPath} 
          texturePath={model.texturePath}
          isCenter={isCenter}
        />
      </Suspense>
    );
  }
  return <Fallback3DModel type={model.type} direction={direction} />;
}

function Slide({ model, isCenter, direction, isLeaving }) {
  const cameraSettings = model.cameraSettings || {
    position: [6.6, 4.5, -4],
    fov: 25,
    zoom: 1
  };

  return (
    <div className={`slide ${isCenter ? 'center-slide' : 'side-slide'} ${direction} ${isLeaving ? 'leaving' : ''}`}>
      <div className="model-container">
        <Canvas
          shadows
          camera={{ 
            position: cameraSettings.position, 
            fov: cameraSettings.fov,
            zoom: cameraSettings.zoom || 1
          }}
        >
          <ambientLight intensity={0.6} />
          
          <directionalLight
            position={[5, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[2024, 2024]}
            shadow-bias={-0.0001}
          />
          
          <pointLight position={[0, 5, 2]} intensity={0.4} />
          <pointLight position={[-2, 3, 4]} intensity={0.3} color="#30e1b9" />
          <pointLight position={[2, 2, 3]} intensity={0.3} color="#30e1b9" />
          
          <mesh
            position={[0, -2.2, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[6, 6]} />
            <shadowMaterial transparent opacity={0.5} />
          </mesh>
          
          <ModelWrapper model={model} isCenter={isCenter} direction={direction} />
          
          {isCenter && (
            <OrbitControls 
              enableZoom={true}
              enablePan={true}
              autoRotate={false}
              enableDamping={true}
              dampingFactor={0.05}
            />
          )}
        </Canvas>
      </div>
      <div className="slide-info">
        <h3>{model.title}</h3>
        <p>{model.description}</p>
      </div>
    </div>
  );
}

function Gallery({ title, models, startIndex = 0, category }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState('');
  const [leavingIndex, setLeavingIndex] = useState(null);

  const nextSlide = () => {
    if (isTransitioning) return;
    setDirection('slide-next');
    setIsTransitioning(true);
    setLeavingIndex(currentIndex);
    
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % models.length);
      setLeavingIndex(null);
      setTimeout(() => {
        setIsTransitioning(false);
        setDirection('');
      }, 50);
    }, 300);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setDirection('slide-prev');
    setIsTransitioning(true);
    setLeavingIndex(currentIndex);
    
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + models.length) % models.length);
      setLeavingIndex(null);
      setTimeout(() => {
        setIsTransitioning(false);
        setDirection('');
      }, 50);
    }, 300);
  };

  const getPrevIndex = () => (currentIndex - 1 + models.length) % models.length;
  const getNextIndex = () => (currentIndex + 1) % models.length;

  const getSlideClasses = (index, isCenterSlide) => {
    let classes = '';
    if (isTransitioning) {
      if (index === leavingIndex) {
        classes = direction === 'slide-next' ? 'exit-left' : 'exit-right';
      } else if (isCenterSlide) {
        classes = direction === 'slide-next' ? 'enter-from-right' : 'enter-from-left';
      }
    }
    return classes;
  };

  return (
    <div className={`gallery-section ${category}`}>
      <h2 className="gallery-title">{title}</h2>
      <div className="slider-container">
        <button className="slider-nav prev" onClick={prevSlide} disabled={isTransitioning}>
          <img src="/images/arrow_l.png" alt="Previous" className="nav-icon prev-icon" />
        </button>
        
        <div className="slider-wrapper">
          <div className="slider-track">
            <div className={`slide-wrapper ${getSlideClasses(getPrevIndex(), false)}`}>
              <Slide 
                model={models[getPrevIndex()]} 
                isCenter={false} 
                direction={direction}
                isLeaving={leavingIndex === getPrevIndex()}
              />
            </div>
            <div className={`slide-wrapper ${getSlideClasses(currentIndex, true)}`}>
              <Slide 
                model={models[currentIndex]} 
                isCenter={true} 
                direction={direction}
                isLeaving={leavingIndex === currentIndex}
              />
            </div>
            <div className={`slide-wrapper ${getSlideClasses(getNextIndex(), false)}`}>
              <Slide 
                model={models[getNextIndex()]} 
                isCenter={false} 
                direction={direction}
                isLeaving={leavingIndex === getNextIndex()}
              />
            </div>
          </div>
        </div>
        
        <button className="slider-nav next" onClick={nextSlide} disabled={isTransitioning}>
          <img src="/images/arrow_r.png" alt="Next" className="nav-icon next-icon" />
        </button>
      </div>

      <div className="indicators">
        {models.map((_, idx) => (
          <button
            key={idx}
            className={`indicator ${idx === currentIndex ? 'active' : ''} ${isTransitioning ? 'disabled' : ''}`}
            onClick={() => {
              if (!isTransitioning && idx !== currentIndex) {
                if (idx > currentIndex) {
                  setDirection('slide-next');
                } else {
                  setDirection('slide-prev');
                }
                setIsTransitioning(true);
                setLeavingIndex(currentIndex);
                
                setTimeout(() => {
                  setCurrentIndex(idx);
                  setLeavingIndex(null);
                  setTimeout(() => {
                    setIsTransitioning(false);
                    setDirection('');
                  }, 50);
                }, 300);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniNavigator() {
  const handleCall = () => {
    window.location.href = 'tel:+79991234567';
  };

  return (
    <div className="mini-nav">
      <div className="company-name">BuffTeam</div>
      <div className="contact-info">
        <a href="tel:+79991234567" className="phone-number">
          📞 +7 (999) 123-45-67
        </a>
        <button onClick={handleCall} className="call-button">
          Позвонить
        </button>
      </div>
    </div>
  );
}

function ReviewsSection() {
  const reviews = [
    {
      id: 1,
      name: 'Алексей Иванов',
      avatar: '👨‍💻',
      rating: 5,
      text: 'Отличная команда! Сделали проект в срок и с высоким качеством. Особенно порадовала 3D визуализация.',
      date: '15.03.2024'
    },
    {
      id: 2,
      name: 'Мария Смирнова',
      avatar: '👩‍🎨',
      rating: 5,
      text: 'Работа с BuffTeam — одно удовольствие! Профессиональный подход, креативные идеи и отличная реализация.',
      date: '02.02.2024'
    },
    {
      id: 3,
      name: 'Дмитрий Петров',
      avatar: '👨‍🔧',
      rating: 4,
      text: 'Хорошая работа, рекомендую. Были небольшие задержки, но в итоге всё сделали качественно.',
      date: '20.01.2024'
    },
    {
      id: 4,
      name: 'Елена Козлова',
      avatar: '👩‍💼',
      rating: 5,
      text: 'BuffTeam создали для нас потрясающий 3D контент. Клиенты в восторге! Будем сотрудничать дальше.',
      date: '10.12.2023'
    },
    {
      id: 5,
      name: 'Сергей Морозов',
      avatar: '👨‍🎤',
      rating: 5,
      text: 'Профессионалы своего дела. Все пожелания учтены, результат превзошел ожидания. Спасибо!',
      date: '05.11.2023'
    }
  ];

  return (
    <div className="reviews-section">
      <h2 className="reviews-title">⭐ Отзывы клиентов</h2>
      <div className="reviews-container">
        {reviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <div className="review-avatar">{review.avatar}</div>
              <div className="review-author">
                <h4>{review.name}</h4>
                <div className="review-stars">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
              </div>
            </div>
            <p className="review-text">"{review.text}"</p>
            <div className="review-date">{review.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="about-section">
      <h2 className="about-title">📌 О компании BuffTeam</h2>
      <p className="about-description">
        BuffTeam — это команда профессионалов, специализирующихся на создании 
        интерактивных 3D приложений, веб-сайтов и игр. Мы объединяем творческий подход 
        с передовыми технологиями, чтобы воплотить самые смелые идеи в жизнь.
      </p>
      <div className="about-features">
        <div className="feature">
          <span>🎮</span> 3D Моделирование
        </div>
        <div className="feature">
          <span>💻</span> Веб-разработка
        </div>
        <div className="feature">
          <span>🎨</span> UI/UX Дизайн
        </div>
        <div className="feature">
          <span>📱</span> Мобильные приложения
        </div>
        <div className="feature">
          <span>🚀</span> Техподдержка 24/7
        </div>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);

  const entities = [
    { 
      id: 0, 
      title: '🐉 Дракон', 
      description: 'Огненный дракон, извергающий пламя', 
      useObj: false, 
      type: 'entity',
      cameraSettings: {
        position: [8, 5, -6],
        fov: 30,
        zoom: 1
      }
    },
    { 
      id: 1, 
      title: '⚔️ Меч', 
      description: 'Древний рыцарский меч', 
      useObj: false, 
      type: 'entity',
      cameraSettings: {
        position: [4, 3, -3],
        fov: 35,
        zoom: 1
      }
    },
    { 
      id: 2, 
      title: '🐍 Кусака', 
      description: 'Плотоядное растение с острыми зубами',
      useObj: true,
      type: 'entity',
      objPath: '/models/snapper/snapper.obj',
      texturePath: '/models/snapper/snapper.png',
      cameraSettings: {
        position: [5, 3.5, -4],
        fov: 28,
        zoom: 1
      }
    },
    { 
      id: 3, 
      title: '💎 Кристалл', 
      description: 'Магический кристалл маны', 
      useObj: false, 
      type: 'entity',
      cameraSettings: {
        position: [3, 2.5, -3],
        fov: 40,
        zoom: 1.2
      }
    },
    { 
      id: 4, 
      title: '🌿 Лесной дух', 
      description: 'Древний хранитель леса', 
      useObj: true, 
      type: 'entity',
      objPath: '/models/ron/ron.obj',
      texturePath: '/models/ron/Ron.png',
      cameraSettings: {
        position: [1, 1, -15],
        fov: 32,
        zoom: 1
      }
    },
    { 
      id: 5, 
      title: '🗡️ Теневой клинок', 
      description: 'Клинок, выкованный из самой тьмы', 
      useObj: false, 
      type: 'entity',
      cameraSettings: {
        position: [4.5, 3, -3.5],
        fov: 35,
        zoom: 1
      }
    },
    { 
      id: 6, 
      title: '❄️ Ледяной голем', 
      description: 'Голем из вечной мерзлоты', 
      useObj: false, 
      type: 'entity',
      cameraSettings: {
        position: [1, 1, -1],
        fov: 28,
        zoom: 1
      }
    },
    { 
      id: 7, 
      title: '🦅 Феникс', 
      description: 'Птица возрождения из огня', 
      useObj: false, 
      type: 'entity',
      cameraSettings: {
        position: [6, 4, -5],
        fov: 30,
        zoom: 1
      }
    },
  ];

  const items = [
    { 
      id: 0, 
      title: 'Демоническая маска', 
      description: 'Маска неизвестного происхождения', 
      useObj: true, 
      type: 'item',
      objPath: '/models/demon_mask1/demon_mask1.obj',
      texturePath: '/models/demon_mask1/demon_mask1.png',
      cameraSettings: {
        position: [3, 2.5, -3],
        fov: 35,
        zoom: 1.1
      }
    },
    { 
      id: 1, 
      title: '🏺 Золотая амфора', 
      description: 'Древнегреческий артефакт', 
      useObj: true, 
      type: 'item',
      objPath: '/models/mask_buggi/mask_buggi.obj',
      texturePath: '/models/mask_buggi/mask_buggi.png',
      cameraSettings: {
        position: [4, 3, -3.5],
        fov: 32,
        zoom: 1
      }
    },
    { 
      id: 2, 
      title: '🔮 Хрустальный шар', 
      description: 'Шар для предсказаний судьбы', 
      useObj: false, 
      type: 'item',
      cameraSettings: {
        position: [3.5, 3, -3],
        fov: 38,
        zoom: 1.2
      }
    },
    { 
      id: 3, 
      title: '⚗️ Зелье здоровья', 
      description: 'Восстанавливает жизненные силы', 
      useObj: false, 
      type: 'item',
      cameraSettings: {
        position: [3, 2.8, -2.8],
        fov: 35,
        zoom: 1
      }
    },
    { 
      id: 4, 
      title: '🗝️ Древний ключ', 
      description: 'Ключ от забытой гробницы', 
      useObj: false, 
      type: 'item',
      cameraSettings: {
        position: [3.2, 2.5, -2.5],
        fov: 35,
        zoom: 1.1
      }
    },
    { 
      id: 5, 
      title: '💍 Кольцо власти', 
      description: 'Магическое кольцо с рубином', 
      useObj: false, 
      type: 'item',
      cameraSettings: {
        position: [3, 2.5, -2.5],
        fov: 35,
        zoom: 1.2
      }
    },
    { 
      id: 6, 
      title: '🏆 Трофей чемпиона', 
      description: 'Золотой кубок победителя', 
      useObj: false, 
      type: 'item',
      cameraSettings: {
        position: [4, 3.2, -3.5],
        fov: 32,
        zoom: 1
      }
    },
    { 
      id: 7, 
      title: '⚡ Громовой амулет', 
      description: 'Амулет с силой молнии', 
      useObj: false, 
      type: 'item',
      cameraSettings: {
        position: [3, 2.5, -2.8],
        fov: 35,
        zoom: 1.1
      }
    },
  ];

  const guiExamples = [
    { 
      id: 0, 
      title: '🎮 Главное меню', 
      description: 'Интерактивное меню с плавными анимациями', 
      useObj: false, 
      type: 'gui',
      cameraSettings: {
        position: [5, 4, -4],
        fov: 30,
        zoom: 1
      }
    },
    { 
      id: 1, 
      title: '📊 Дашборд', 
      description: 'Аналитическая панель с графиками', 
      useObj: false, 
      type: 'gui',
      cameraSettings: {
        position: [6, 4.5, -5],
        fov: 28,
        zoom: 1
      }
    },
    { 
      id: 2, 
      title: '💬 Чат интерфейс', 
      description: 'Современный чат с анимацией сообщений', 
      useObj: false, 
      type: 'gui',
      cameraSettings: {
        position: [4.5, 3.5, -3.5],
        fov: 32,
        zoom: 1
      }
    },
    { 
      id: 3, 
      title: '🎨 Редактор', 
      description: 'Инструменты для творчества', 
      useObj: false, 
      type: 'gui',
      cameraSettings: {
        position: [5.5, 4, -4.5],
        fov: 30,
        zoom: 1
      }
    },
    { 
      id: 4, 
      title: '📱 Мобильное приложение', 
      description: 'Адаптивный UI для телефонов', 
      useObj: false, 
      type: 'gui',
      cameraSettings: {
        position: [4, 3.5, -3],
        fov: 35,
        zoom: 1
      }
    },
    { 
      id: 5, 
      title: '🛒 Интернет-магазин', 
      description: 'Каталог с фильтрацией и корзиной', 
      useObj: false, 
      type: 'gui',
      cameraSettings: {
        position: [6, 4, -5],
        fov: 28,
        zoom: 1
      }
    },
    { 
      id: 6, 
      title: '🎵 Медиаплеер', 
      description: 'Современный аудиоплеер с эквалайзером', 
      useObj: false, 
      type: 'gui',
      cameraSettings: {
        position: [5, 3.8, -4],
        fov: 30,
        zoom: 1
      }
    },
    { 
      id: 7, 
      title: '📅 Календарь', 
      description: 'Планировщик событий с напоминаниями', 
      useObj: false, 
      type: 'gui',
      cameraSettings: {
        position: [4.5, 3.5, -3.5],
        fov: 32,
        zoom: 1
      }
    },
  ];

  const tabs = [
    { id: 0, title: 'Сущности', icon: '🐉', color: '#30e1b9', gallery: entities, startIndex: 2 },
    { id: 1, title: 'Предметы', icon: '📦', color: '#30e1b9', gallery: items, startIndex: 0 },
    { id: 2, title: 'GUI', icon: '🎨', color: '#30e1b9', gallery: guiExamples, startIndex: 0 },
  ];

  const switchTab = (tabId) => {
    if (isTabTransitioning || tabId === activeTab) return;
    setIsTabTransitioning(true);
    setActiveTab(tabId);
    setTimeout(() => setIsTabTransitioning(false), 500);
  };

  const currentGallery = tabs[activeTab].gallery;
  const currentStartIndex = tabs[activeTab].startIndex;

  return (
    <div className="app">
      <div className="overlay"></div>
      <div className="content">
        <h1>🎨 3D Портфолио</h1>
        <p>Интерактивная галерея 3D моделей, предметов и GUI интерфейсов</p>
        
        <AboutSection />
        
        <div className="tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => switchTab(tab.id)}
              style={{ '--tab-color': tab.color }}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-title">{tab.title}</span>
            </button>
          ))}
        </div>

        <div className={`gallery-wrapper ${isTabTransitioning ? 'transitioning' : ''}`}>
          <Gallery 
            key={activeTab}
            title="" 
            models={currentGallery} 
            startIndex={currentStartIndex}
            category={tabs[activeTab].title.toLowerCase()}
          />
        </div>

        <ReviewsSection />
      </div>
      
      <MiniNavigator />
    </div>
  );
}

export default App;