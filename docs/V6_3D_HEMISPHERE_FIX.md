# V6 — 3D 지구본 반대편 렌더링 수정

## 문제

3D에서 서울 → 일본을 선택하면 비행기/핀/라벨은 동아시아 위치에 투영되지만, WebGL 지구 표면은 아프리카·인도양 쪽 반대편이 보였습니다. 사용자가 지구본을 반대 방향으로 돌려야 한국과 일본을 볼 수 있었습니다.

## 실제 원인

`src/modules/globe3d.js`의 구체 mesh index 순서가 안쪽을 향하는 winding이었습니다.

이전 인덱스:

```js
indices.push(a, b, a + 1, b, b + 1, a + 1);
```

이 순서의 삼각형 normal은 구 중심 방향(안쪽)을 향합니다. WebGL 렌더링에서는 `gl.enable(gl.CULL_FACE)`가 사용되고 있었기 때문에 카메라 쪽의 실제 앞면이 BACK face로 판단되어 제거되고, 반대쪽 hemisphere의 면이 보였습니다.

## 수정

삼각형을 바깥쪽 CCW winding으로 변경했습니다.

```js
indices.push(a, a + 1, b, b, a + 1, b + 1);
```

그리고 렌더링 상태를 명시적으로 고정했습니다.

```js
gl.frontFace(gl.CCW);
gl.cullFace(gl.BACK);
```

이제 3D 표면과 overlay에서 사용하는 동일한 위도/경도 좌표가 같은 hemisphere에 표시됩니다.

## 서울 → 도쿄 기준 검증

- 서울: 37.5665 N, 126.9780 E
- 도쿄: 약 35.68 N, 139.65 E
- 카메라 route midpoint: 동아시아
- 서울/도쿄의 회전 후 z 값: 양수 → 카메라 쪽 hemisphere
- sphere triangle normal dot position: 양수 → outward facing

따라서 기본 `경로 맞춤` 상태에서 지구 표면 자체가 한국·일본 방향을 보여야 하며, 사용자가 지구본을 반대로 돌릴 필요가 없습니다.
