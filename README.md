# 3D Portfolio

![React](https://img.shields.io/badge/React-19-61DAFB)
![Three.js](https://img.shields.io/badge/Three.js-r183-000000)
![Vite](https://img.shields.io/badge/Vite-8-646CFF)

Сайт-витрина 3D-моделей команды BuffTeam. Модели в стиле Minecraft загружаются прямо в браузер, их можно крутить мышью и листать по категориям.

> **English:** a showcase website for 3D models built with React, React Three Fiber and Three.js. Blockbench-style OBJ models with pixel textures are rendered in real time with orbit controls, grouped into tabbed galleries.

## Возможности

- Интерактивный просмотр 3D-моделей: вращение и масштаб мышью (`OrbitControls`).
- Загрузка моделей в формате OBJ с текстурами, пиксельная фильтрация (`NearestFilter`) для чёткого Minecraft-стиля.
- Галереи по вкладкам с перелистыванием моделей.
- Запасная анимированная модель, пока основная загружается.
- Разделы «О команде», отзывы и контакты.

## Стек

- [React 19](https://react.dev/)
- [React Three Fiber](https://r3f.docs.pmnd.rs/) и [drei](https://github.com/pmndrs/drei)
- [Three.js](https://threejs.org/) (`OBJLoader`, `TextureLoader`)
- [Vite](https://vite.dev/), ESLint

## Запуск

Нужен Node.js 20+.

```bash
npm install
npm run dev       # dev-сервер с горячей перезагрузкой
npm run build     # production-сборка в dist/
npm run preview   # посмотреть собранную версию
```

## Структура

```
public/models/   модели (.obj, .mtl, .png) по папкам
public/images/   иконки интерфейса
src/App.jsx      компоненты: просмотрщик модели, галерея, разделы страницы
```

Чтобы добавить модель, положите `.obj` и текстуру в `public/models/<имя>/` и добавьте запись в список моделей в `src/App.jsx`.
