export const vertexShaderSource = `
  precision mediump float;
  attribute vec2 a_position;
  uniform vec2 u_resolution;

  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

export const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_users[10];
  uniform int u_userCount;
  uniform vec2 u_currentUserPos;
  uniform bool u_isViewer;

  // Simplified noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Simplified bytebeat-inspired pattern
  float bytebeat(vec2 pos, float time) {
    float t = time * 10.0; // Slower time scale
    float x = floor(pos.x * 32.0);
    float y = floor(pos.y * 24.0);

    // Simplified formulas without complex bitwise operations
    float pattern1 = mod(t * x + y, 256.0);
    float pattern2 = mod(t + x * y, 256.0);
    float pattern3 = mod(t * y + x, 256.0);

    float result = mod(pattern1 + pattern2 + pattern3, 256.0);
    return result / 256.0;
  }

  // Enhanced pattern with multiple layers
  float complexBytebeat(vec2 pos, float time) {
    float result = 0.0;
    result += bytebeat(pos, time) * 0.5;
    result += bytebeat(pos * 2.0, time * 0.7) * 0.3;
    result += bytebeat(pos * 0.5, time * 1.3) * 0.2;
    return result;
  }

  float drawCursor(vec2 st, vec2 cursorPos, float size) {
    vec2 diff = st - cursorPos;
    float dist = length(diff);

    // Crosshair cursor
    float horizontal = step(abs(diff.y), size * 0.1) * step(abs(diff.x), size * 0.8);
    float vertical = step(abs(diff.x), size * 0.1) * step(abs(diff.y), size * 0.8);
    float center = 1.0 - step(size * 0.3, dist);

    return max(max(horizontal, vertical), center);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec3 color = vec3(0.0);

    // Create RGB channels with different bytebeat parameters
    float r = complexBytebeat(st + vec2(0.1, 0.0), u_time) * 0.4;
    float g = complexBytebeat(st + vec2(0.0, 0.1), u_time * 1.1) * 0.4;
    float b = complexBytebeat(st + vec2(0.05, 0.05), u_time * 0.9) * 0.4;

    color = vec3(r, g, b);

    // Add high-contrast geometric elements
    // Sharp grid lines
    float gridSize = 16.0;
    vec2 grid = fract(st * gridSize);
    float gridLines = step(0.95, grid.x) + step(0.95, grid.y);
    color += vec3(gridLines * 0.3);

    // High-contrast diagonal stripes modulated by cursor data
    float stripeIntensity = 0.0;
    float stripeFreq = 40.0;
    for(int i = 0; i < 10; i++) {
      if(i >= u_userCount) break;
      vec2 userPos = u_users[i] / u_resolution.xy;
      // Use user position to modulate stripe frequency and phase
      stripeFreq += userPos.x * 20.0;
      stripeIntensity += userPos.y * 0.3;
    }

    float stripes = sin((st.x + st.y) * stripeFreq + u_time * 2.0 + stripeIntensity);
    stripes = step(0.8, stripes);
    color += vec3(stripes * (0.2 + stripeIntensity * 0.1));

    // Add user influence
    for(int i = 0; i < 10; i++) {
      if(i >= u_userCount) break;

      vec2 userPos = u_users[i] / u_resolution.xy;
      float dist = distance(st, userPos);
      float userInfluence = 1.0 / (dist * 3.0 + 1.0);

      // User-specific bytebeat pattern
      float userTime = u_time + float(i) * 0.3;
      vec2 userSt = st + userPos * 0.5;
      float userPattern = bytebeat(userSt, userTime);

      // User color
      float userHue = float(i) * 0.618034;
      vec3 userColor = vec3(
        sin(userHue * 6.28318) * 0.5 + 0.5,
        sin(userHue * 6.28318 + 2.094) * 0.5 + 0.5,
        sin(userHue * 6.28318 + 4.188) * 0.5 + 0.5
      );

      color += userColor * userPattern * userInfluence * 0.5;

      // Draw cursor
      float cursor = drawCursor(st, userPos, 0.02);
      color = mix(color, userColor * 2.0, cursor * 0.8);
    }

    // Draw current user's cursor
    if (!u_isViewer) {
      vec2 currentUserPos = u_currentUserPos / u_resolution.xy;
      float currentCursor = drawCursor(st, currentUserPos, 0.025);
      vec3 currentUserColor = vec3(1.0, 1.0, 0.8);
      color = mix(color, currentUserColor * 3.0, currentCursor * 0.9);
    }

    // Analog effects
    float scanlines = sin(st.y * u_resolution.y * 1.5) * 0.1 + 0.9;
    color *= scanlines;

    // Vignette
    float vignette = 1.0 - distance(st, vec2(0.5)) * 0.3;
    color *= vignette;

    // Add some noise
    float finalNoise = noise(st * 20.0 + u_time) * 0.02;
    color += vec3(finalNoise);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}
