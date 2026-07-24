import os
import time
import joblib
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

def train_and_save_model(n_estimators=100, max_depth=None, test_size=0.2, random_state=42):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "iris_model.joblib")
    
    # 1. 載入 Iris 資料集
    iris = load_iris()
    X, y = iris.data, iris.target
    
    # 2. 切分訓練集與測試集
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
    
    # 3. 訓練模型
    start_time = time.time()
    model = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=random_state)
    model.fit(X_train, y_train)
    train_time = time.time() - start_time
    
    # 4. 計算準確度
    accuracy = float(model.score(X_test, y_test))
    
    # 5. 包裝成 app.py 要求的特定字典格式
    model_data = {
        "model": model,
        "target_names": [str(name) for name in iris.target_names],
        "feature_names": [str(name) for name in iris.feature_names],
        "feature_importances": model.feature_importances_.tolist(),
        "accuracy": accuracy,
        "train_time": train_time,
        "n_estimators": n_estimators,
        "max_depth": max_depth,
        "test_size": test_size,
        "random_state": random_state
    }
    
    # 6. 儲存模型檔案
    joblib.dump(model_data, model_path)
    
    # 回傳給 app.py 渲染結果畫面
    return {
        "status": "success",
        "accuracy": accuracy,
        "train_time": train_time,
        "feature_importances": dict(zip(iris.feature_names, model.feature_importances_)),
        "message": f"模型訓練成功！準確度達 {accuracy:.4f}"
    }

if __name__ == "__main__":
    train_and_save_model()
