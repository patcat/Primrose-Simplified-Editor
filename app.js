var BRICK = "images/brick.png",
    GROUND = "images/deck.png",
    SKY = "images/bg2.jpg",
    app = new Primrose.BrowserEnvironment("Our Simplified 3D Editor", {
      skyTexture: SKY,
      groundTexture: GROUND
    }),
    editor = null,
    subScene = new THREE.Object3D(),
    scriptUpdateTimeout,
    lastScript = null,
    scriptAnimate = null,
    editorFrameMesh = null,
    editorFrame = new Primrose.Surface({
      bounds: new Primrose.Text.Rectangle(0, 0, 2048, 2048)
    });

app.addEventListener("ready", function() {
  app.scene.add(subScene);

  editor = new Primrose.Text.Controls.TextBox({
    bounds: new Primrose.Text.Rectangle(0, 0, editorFrame.surfaceWidth, Math.floor(editorFrame.surfaceHeight)),
    tokenizer: Primrose.Text.Grammars.JavaScript,
    value: getSourceCode(isInIFrame),
    fontSize: 45
  });

  editorFrame.appendChild(editor);

  editorFrameMesh = textured(shell(1, 16, 16), editorFrame);
  editorFrameMesh.name = "MyWindow";
  editorFrameMesh.position.set(0, app.avatarHeight, 0);
  app.scene.add(editorFrameMesh);
  app.registerPickableObject(editorFrameMesh);
});

app.addEventListener("update", function(dt) {
  if (!scriptUpdateTimeout) {
    scriptUpdateTimeout = setTimeout(updateScript, 500);
  }

  if (scriptAnimate) {
    try {
      scriptAnimate.call(app, dt);
    }
    catch (exp) {
      console.error(exp);
      scriptAnimate = null;
    }
  }
});

app.addEventListener("keydown", function(evt) {
  if (scriptUpdateTimeout) {
    clearTimeout(scriptUpdateTimeout);
    scriptUpdateTimeout = null;
  }
});

function updateScript() {
  var newScript = editor.value,
      exp;
  if (newScript !== lastScript) {
    lastScript = newScript;
    if (newScript.indexOf("function update") >= 0 &&
        newScript.indexOf("return update") < 0) {
      newScript += "\nreturn update;";
    }
    try {
      console.log("Loading new script...");
      var scriptUpdate = new Function("scene", newScript);
      for (var i = subScene.children.length - 1; i >= 0; --i) {
        subScene.remove(subScene.children[i]);
      }

      // Calls our new function.
      scriptAnimate = scriptUpdate.call(app, subScene);
      console.log("Script loaded!");
    }
    catch (exp) {
      console.error(exp);
      console.log("ERR: " + exp.message);
      scriptAnimate = null;
    }
  }
  scriptUpdateTimeout = null;
}

app.setFullScreenButton("goVR", "click", true);
app.setFullScreenButton("goRegular", "click", false);

function getSourceCode() {
  var src = testDemo.toString(),
      lines = src.replace("\r\n", "\n").split("\n");
  
  lines.pop();
  lines.shift();
  for (var i = 0; i < lines.length; ++i) {
    lines[i] = lines[i].substring(2);
  }
  src = lines.join("\n");
  return src.trim();
}

function testDemo(scene) {
  var WIDTH = 5,
      HEIGHT = 5,
      DEPTH = 5,
      MIDX = WIDTH / 2,
      MIDY = HEIGHT / 2, MIDZ = DEPTH / 2,
      t = 0,
      start = put(hub())
      .on(scene)
      .at(-MIDX, 0, -DEPTH - 2);

  put(light(0xffffff, 1, 500))
      .on(start)
      .at(MIDX + 5, 8, MIDZ + 20);

  var balls = [ ];

  for (var i = 0; i < 10; ++i) {
    balls.push(put(brick(BRICK))
        .on(start)
        .at(Primrose.Random.int(WIDTH),
            Primrose.Random.int(HEIGHT),
            Primrose.Random.int(DEPTH)));

    balls[i].velocity = v3(
        Primrose.Random.number(0, WIDTH),
        Primrose.Random.number(0, HEIGHT),
        Primrose.Random.number(0, DEPTH));
  }

  function update(dt) {
    t += dt;
    for (var i = 0; i < balls.length; ++i) {
      var ball = balls[i];
      ball.position.add(ball.velocity.clone().multiplyScalar(dt));
      if (ball.position.x < 0 && ball.velocity.x < 0
          || WIDTH <= ball.position.x && ball.velocity.x > 0) {
        ball.velocity.x *= -1;
      }
      if (ball.position.y < 1 && ball.velocity.y < 0
          || HEIGHT <= ball.position.y && ball.velocity.y > 0) {
        ball.velocity.y *= -1;
      }
      if (ball.position.z < 0 && ball.velocity.z < 0
          || DEPTH <= ball.position.z && ball.velocity.z > 0) {
        ball.velocity.z *= -1;
      }
    }
  }
}