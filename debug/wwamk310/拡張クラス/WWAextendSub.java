import java.applet.*;
import java.awt.*;
import java.awt.image.*;
import java.util.*;
import java.io.*;
import java.net.*;

//「//」以降の文はコメントになっています。
//とりあえず定義は読み飛ばしてプログラム本体の１６０行目以降から見てみてください。

////////////////////////////////////////////////////////////////////////////////////////////////
//各変数の意味

// Valiable[０～９９]
//システムで自由に使える変数配列です。セーブ＆ロードで記録されるほかＣＧＩでも送信されます。

// Mode = 0		物体パーツや壁に触れたときや連続イベントが起こった時
// Mode = 1		プレーヤーが１歩移動した時
// Mode = 2		マウスやキーボードが押された時
// Mode = 3		画面を描画する時（通常１秒に５０回）

// PlayerX, PlayerY		プレーヤーのＸ座標、Ｙ座標
// PartsObject	プレーヤーが触れた物体パーツ番号
// PartsMap		プレーヤーの現在位置の背景パーツ番号

// Energy, EnergyMax, Strength, Defence, Gold, Step
//生命力、生命力最大値、攻撃力、防御力、ゴールド、移動回数

// ImgChara, ImgButton, ImgEnergy, ImgStrength, ImgDefence, ImgGold, ImgBom, ImgStatusFrame, ImgMainFrame,
//プレーヤー画像、ボタン画像、各種枠画像の位置、画像位置は座標ではなく（Ｘ＋Ｙ×１０）で指定

// ItemBox[０～１２]
//アイテムボックス

// Map[Ｙ座標][Ｘ座標] ＝ パーツ番号
//マップに配置されている背景パーツ
// Object[Ｙ座標][Ｘ座標] ＝ パーツ番号
//マップに配置されている物体パーツ

// AtrMap[背景番号][変数指定] ＝ 各種ステータス
//背景パーツの各種データ
// AtrObject[物体番号][変数指定] ＝ 各種ステータス
//物体パーツの各種データ

// MapWidth, MapPartsMax, ObjectPartsMax, MesNumberMax,
//マップ全体の幅、背景パーツ最大数、物体パーツ最大数、メッセージ番号最大数

// GlobalMessage[メッセージ番号]
// SystemMessage[０～１９]	システム関連メッセージ
//パーツで使用されているメッセージ。背景パーツならメッセージ番号は、AtrMap[背景番号][ATR_STRING]で指定

// ImgCrop[画像番号]
//４０×４０ドットの画像がはいっています。画像位置は、番号＝Ｘ＋Ｙ×１０に対応しています。
//上から５列目、左から８番目の画像の番号は（５－１）＋（８－１）×１０＝７４になります。

// Gr, GrMap, GrStatus
//画像書き込み用のオブジェクトです。
//「Gr」は５６０×４４０の表画面、「GrMap」は４４０×４４０のマップ裏画面、「GrMap」は１２０×４４０のステータス裏画面です。
//裏画面のGrMapやGrStatusの描画内容が表画面のGrに描画されます。
//ちらちきが生じますので通常は表画面のGrに直接は描画しません。

// bSaveStop, bDefault, bPaintAll, bAnmItem, 
//セーブ禁止フラグ、$defaultフラグ、全画面描画フラグ、アイテム取得時のアニメフラグ

// MusicNumber
//鳴らすサウンドの番号

// TimerCount
//描画毎の待ち時間

// bStopInput
//trueでキー入力の無効化（アニメーションイベントなどに使用）

class WWAextendSub {

////////////////////////////////////////////////////////////////////////////////////////////////
//パーツデータ用数値定義
//AtrMap[背景種別][変数指定]やAtrObject[物体番号][変数指定]の変数指定に対応します。
//ATR_NUMBERなどはパーツの種類により扱いが変わります。
static int ATR_CROP1 = 1;		//パーツ画像位置１
static int ATR_CROP2 = 2;		//パーツ画像位置２
static int ATR_TYPE = 3;		//パーツの種類
static int ATR_MODE = 4;		//多用途（物体通行属性、使用型アイテム、扉属性など）
static int ATR_STRING = 5;		//対応するメッセージ番号
static int ATR_ENERGY = 10;		//↓パーツのステータス
static int ATR_STRENGTH = 11;
static int ATR_DEFENCE = 12;
static int ATR_GOLD = 13;
static int ATR_ITEM = 14;		//売り買いするアイテム番号など
static int ATR_NUMBER = 15;		//多用途（待ち時間、アイテムボックス位置、扉属性など）
static int ATR_JUMP_X = 16;		//↓ジャンプ先のＸＹ座標
static int ATR_JUMP_Y = 17;
static int ATR_SOUND = 19;		//サウンド番号
static int ATR_MOVE = 16;		//移動属性

//AtrMap[背景番号][変数指定]のパーツの種類（変数指定 = ATR_TYPE）に対応します。
static int MAP_STREET = 0;		//道
static int MAP_WALL = 1;		//壁
static int MAP_LOCALGATE = 2;	//ジャンプゲート
static int MAP_URLGATE = 4;		//ＵＲＬゲート

//AtrObject[物体番号][変数指定]のパーツの種類（変数指定 = ATR_TYPE）に対応します。
static int OBJECT_NORMAL = 0;	//通常物体パーツ
static int OBJECT_MESSAGE = 1;	//メッセージパーツ
static int OBJECT_URLGATE = 2;	//ＵＲＬゲート
static int OBJECT_STATUS = 3;	//ステータス変化
static int OBJECT_ITEM = 4;		//アイテム
static int OBJECT_DOOR = 5;		//扉
static int OBJECT_MONSTER = 6;	//モンスター
static int OBJECT_SCORE = 11;	//スコア表示
static int OBJECT_SELL = 14;	//物をを売る
static int OBJECT_BUY = 15;		//物を買う
static int OBJECT_RANDOM = 16;	//ランダム選択
static int OBJECT_SELECT = 17;	//二者択一
static int OBJECT_LOCALGATE = 18;	//ジャンプゲート

////////////////////////////////////////////////////////////////////////////////////////////////
//グローバル変数の定義
//ここで定義した変数はセーブ＆ロードでは記録されませんが、システムが終了するまで内容が保持されます。

static boolean bMouseSkip = false; //マウスクリックのスキップ判定用
static boolean bAnimeFlag = false;
static int iAnimeCount;

////////////////////////////////////////////////////////////////////////////////////////////////
// プログラム本体

public static void Main(
	int Mode, int PartsObject, int PartsMap, int PlayerX, int PlayerY, char PlayerDirect, int PartsX, int PartsY,
	int Energy, int EnergyMax, int Strength, int Defence, int Gold, int Step, int TimerCount,
	int GameoverX, int GameoverY, int ImgChara, int ImgButton, int bSaveStop, int bDefault, boolean bPaintAll, boolean bStopInput, int bAnmItem, int MusicNumber,
	int ImgEnergy, int ImgStrength, int ImgDefence, int ImgGold, int ImgBom, int ImgStatusFrame, int ImgItemFrame, int ImgMainFrame, int ImgClickItem,
	int ItemBox[], int Valiable[],
	short Map[][], short Object[][],
	int Key, int MouseX, int MouseY,
	int MapWidth, int MapPartsMax, int ObjectPartsMax, int MesNumberMax,
	Graphics Gr, Graphics GrMap, Graphics GrStatus, Image ImgCrop[],
	int AtrMap[][], int AtrObject[][],
	String GlobalMessage[], String SystemMessage[]
){
	//作成ツール側でパーツに入力されたメッセージを抽出し「szMes」に格納します。
	String szMes = null;
	if( Mode <= 2 ){
		int MessageNumber = 0;	//メッセージ番号
		//物体パーツにメッセージが記述されていればそのメッセージを格納
		if( PartsObject != 0 ){
			MessageNumber = AtrObject[PartsObject][ATR_STRING];
			if( MessageNumber != 0 ) szMes = GlobalMessage[MessageNumber];
		}
		//物体パーツがなく背景パーツにメッセージが記述されていればそのメッセージを格納
		else {
			MessageNumber = AtrMap[PartsMap][ATR_STRING];
			if( MessageNumber != 0 ) szMes = GlobalMessage[MessageNumber];
		}
	}

	////////////////////////////////////////////////////////////////////////////////////////////////
	// ↓ここから先がメインプログラムでです。
	// この部分を自分でいじってみて挙動を確認してください。
	////////////////////////////////////////////////////////////////////////////////////////////////

	//著作者表記を入れます。システム起動時に「Customized by ...」で表示されます。
	String CopyRight = "？？？";
	//返信用のメッセージです。これを記述すると本体のほうでこのメッセージが表示されます。
	//別記の「ReturnMessageに関する仕様」も参照してください。
	String ReturnMessage = null;
	//画面の更新（通常は使いません。各種設定変更で更新結果が画面に反映されないときに使用してください）
	boolean bReset = false;
	//Mode=0の時（パーツに触れた時）そのパーツに設定されたイベントを実行するかを指定します（bNoExec = trueで実行拒否）
	//拡張クラス側で本体側のイベントを実行するか制御できます。
	//独自に条件判定マクロ文を作成したときなどに使用します。
	boolean bNoExec = false;

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//「Mode=0」この条件文の中はプレーヤーが壁や物体パーツに触れたときに呼び出されます。
	//触れた物体のパーツ番号は「PartsObject」に、背景のパーツ番号は「PartsMap」に格納されます。
	//連続的なイベントが起こった場合はそのたびに呼び出されます。
	//ツール側で指定した内容よりも先にこちらが実行されます。
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( Mode == 0 ){
		//使用する変数の定義
		int i;
		int Xp = 0;
		int Yp = 0;
		boolean bFlag = false;
		
		////////////////////////////////////////////////////////////////////////
		//プレーヤーが物体番号１０（PartsObject=10）に触ったときに実行します（プレーヤーの座標を表示します）
		if( PartsObject == 10 ){
			ReturnMessage = "現在のあなたのいる座標は、\nＸ座標＝" +PlayerX +"\nＹ座標＝" +PlayerY +"\nです。\n私のいる座標は、\nＸ座標＝" +PartsX +"\nＹ座標＝" +PartsY +"\nです。";
		}
		////////////////////////////////////////////////////////////////////////
		//ステータスの変化と表示
		if( PartsObject == 11 ){
			Strength = Strength * 2;
			Defence = Defence / 2;
			ReturnMessage = "プレーヤーの攻撃力を２倍にして、防御力を半分にします。<p>その結果あなたのステータスは、\n";
			ReturnMessage = ReturnMessage +"生命力＝" +Energy +"\n攻撃力＝" +Strength +"\n防御力＝" +Defence +"\n所持金＝" +Gold +"\n移動回数＝" +Step +"\nになりました。";
		}
		//あなたは青い鍵を＊個持っています。
		////////////////////////////////////////////////////////////////////////
		//花の上（背景番号３）を何回通ったかを表示します（Mode=1の部分で加算処理しています）
		if( PartsObject == 12 ){
			ReturnMessage = "あなたは花の上を" +Valiable[5] +"回通りました。";
		}
		////////////////////////////////////////////////////////////////////////
		//所持金加算イベントのフラグを立てます。
		if( PartsObject == 13 ){
			Valiable[6] = 1;
		}
		////////////////////////////////////////////////////////////////////////
		//マップのどこに指定の物体（物体番号１５の黄色い鍵）が存在するか表示します。
		if( PartsObject == 14 ){
			//MapWidth（マップ幅）の回数だけ、Object[Yp][Xp]（物体データ格納配列）を走査します
			for( Xp = 0 ; Xp < MapWidth ; ++Xp ){
				for( Yp = 0 ; Yp < MapWidth ; ++Yp ){
					//指定のＸ座標、Ｙ座標のところに物体番号１５があればフラグを立ててループを抜ける
					if( Object[Yp][Xp] == 15 ){
						bFlag = true;
						break;
					}
				}
				if( bFlag == true ) break;
			}
			//フラグが立っていれば座標を表示
			ReturnMessage = "マップのどこに黄色い鍵、\n物体番号１５があるか探します。<p>";
			if( bFlag == true ){
				ReturnMessage = ReturnMessage +"Ｘ座標＝" +Xp +"\nＹ座標＝" +Yp +"\nに黄色い鍵を発見しました！";
			} else {
				ReturnMessage = ReturnMessage +"黄色い鍵は見つかりませんでした。";
			}
			//System.out.println( "TEST=" +Xp +" " +Yp );
		}
		////////////////////////////////////////////////////////////////////////
		//画像回転処理イベントのフラグを立てます。
		if( PartsObject == 16 ){
			Valiable[8] = 1;
			Valiable[7] = 0;
		}
		////////////////////////////////////////////////////////////////////////
		if( PartsObject == 20 ){
			ReturnMessage = "先ほどマウスの押された座標は、\nＸ座標＝" +Valiable[1] +"\nＹ座標＝" +Valiable[2] +"\n押されたキーは、" +Valiable[3] +" です。";
		}
		////////////////////////////////////////////////////////////////////////
		//条件を満たした場合にのみパーツ側で設定された内容を実行します。
		//独自の条件判定マクロ文を作ったときなどに使用してください。
		if( PartsObject == 21 ){
			for( i = 0 ; i < 12 ; ++i ){
				//パーツ番号１７のアイテムを持っていた場合
				if( ItemBox[i] == 17 ) break;
			}
			//パーツ番号１７のアイテムを持っていなければ、bNoExecを指定してパーツに設定された内容を実行しない。
			if( i == 12 ) bNoExec = true;
		}
		////////////////////////////////////////////////////////////////////////
		//マウスイベントのフラグを立てます。
		if( PartsObject == 22 ){
			Valiable[10] = 1;
		}
		////////////////////////////////////////////////////////////////////////
		//アニメーションイベントのフラグを立てて終了するまで入力を無効化します。
		if( PartsObject == 23 ){
			bAnimeFlag = true;
			iAnimeCount = 0;
			//入力無効化
			bStopInput = true;
		}
		/////////////////////////////////////////////////////////////////////////
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//「Mode=1」この条件文の中はプレーヤーが１歩移動するたびに呼び出されます。
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( Mode == 1 ){
		////////////////////////////////////////////////////////////////////////
		//プレーヤーが花の上（背景番号３）を１回通るたびに変数配列５を１加算します。
		if( PartsMap == 3 ) ++Valiable[5];
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//「Mode=2」この条件文の中はマウスやキーが押されるたびに呼び出されます。
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( Mode == 2 ){
		////////////////////////////////////////////////////////////////////////
		//マウスの押された座標を変数１と２に押されたキーを変数配列３に格納
		if( MouseX != 0 ) Valiable[1] = MouseX;
		if( MouseY != 0 ) Valiable[2] = MouseY;
		if( Key != 0 ) Valiable[3] = Key;
		////////////////////////////////////////////////////////////////////////
		//指定位置（ＸＹ座標４０～１２０）でマウスボタンが押されたらイベントを起こします。
		//メッセージをクリアするためのマウスクリックでも判定がおこなわれてしまいますので、
		//フラグ「bMouseSkip」をこの拡張クラス内で定義して１回分、マウスやキーの入力判定をスキップします。
		//変数配列１０のフラグが立っていれば判定します。
		if( (Valiable[10] == 1) && (MouseX > 40) && (MouseX < 120) && (MouseY > 40) && (MouseY < 120) && (bMouseSkip == false) ){
			ReturnMessage = "マウスの押された座標は、\nＸ座標＝" +Valiable[1] +"\nＹ座標＝" +Valiable[2] +" です。";
			bMouseSkip = true;
		} else {
			bMouseSkip = false;
		}
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//「Mode=3」この条件文の中は画面が１回描画されるたび（通常１秒に５０回）に呼び出されます。
	//画像関連の処理はここでおこなってください。
	//部分描画モードでは正常に機能しませんので「bPaintAll=true」で強制的に全画面描画モードにすることが必要です。
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( Mode == 3 ){
		////////////////////////////////////////////////////////////////////////
		//フラグが立っていれば所持金加算をスタートします。
		if( (Gold < 1000) && (Valiable[6] == 1) ) ++Gold;
		////////////////////////////////////////////////////////////////////////
		//画像回転処理
		if( (Valiable[8] == 1) && (Valiable[7] < 1000) ){
			++Valiable[7];
			//角度と座標計算
			double dAngle = Valiable[7] * 0.0314 * 5;
			int iX = 200 +(int)(100 *Math.sin(dAngle));
			int iY = 200 +(int)(100 *Math.cos(dAngle));
			//描画
			bPaintAll = true;
			GrMap.drawImage( ImgCrop[23], iX, iY, null );
		}
		////////////////////////////////////////////////////////////////////////
		//アニメーションが終了するまで入力を無効化します。
		if( bAnimeFlag == true ){
			++iAnimeCount;
			//アニメーション終了
			if( iAnimeCount > 200 ){
				bStopInput = false;
				bAnimeFlag = false;
			}
			//描画
			bPaintAll = true;
			GrMap.drawImage( ImgCrop[23], iAnimeCount *2, iAnimeCount *2, null );
		}
	}
	//「Mode=4」システムの立ち上げ時にCopyRightを参照にするために呼び出されます。

	////////////////////////////////////////////////////////////////////////////////////////////////
	// ↑メインプログラムはここまで。
	////////////////////////////////////////////////////////////////////////////////////////////////

	//拡張クラス呼び出し
	//WWA wwa = new WWA();
	WWAextend wwa = new WWAextend();
	wwa.ReturnExtend(
		Mode, PlayerX, PlayerY, PlayerDirect,
		Energy, EnergyMax, Strength, Defence, Gold, Step, TimerCount,
		GameoverX, GameoverY, ImgChara, ImgButton, bSaveStop, bDefault, bPaintAll, bStopInput, bAnmItem, MusicNumber,
		ImgEnergy, ImgStrength, ImgDefence, ImgGold, ImgBom, ImgStatusFrame, ImgItemFrame, ImgMainFrame, ImgClickItem,
		ItemBox, Valiable,
		Map, Object,
		ReturnMessage, CopyRight, bReset, bNoExec,
		AtrMap, AtrObject,
		GlobalMessage, SystemMessage
	);
}
}


////////////////////////////////////////////////////////////////////////////////////////////////
// プログラム返信用
// そのままコンパイルするとＷＷＡ本体の「WWAextend.class」が
//同時に上書きされて中身のないファイルになります（ファイルサイズを確認）ので、
// 「WWAextend.class」はファイルのプロパティで上書き禁止にしてしまってください。
//class WWA {
class WWAextend {
public static void ReturnExtend(
		int Mode, int PlayerX, int PlayerY, char PlayerDirect,
		int Energy, int EnergyMax, int Strength, int Defence, int Gold, int Step, int TimerCount,
		int GameoverX, int GameoverY, int ImgChara, int ImgButton, int bSaveStop, int bDefault, boolean bPaintAll, boolean bStopInput, int bAnmItem, int MusicNumber,
		int ImgEnergy, int ImgStrength, int ImgDefence, int ImgGold, int ImgBom, int ImgStatusFrame, int ImgItemFrame, int ImgMainFrame, int ImgClickItem,
		int ItemBox[], int Valiable[],
		short Map[][], short Object[][],
		String ReturnMessage, String CopyRight, boolean bReset, boolean bNoExec,
		int AtrMap[][], int AtrObject[][],
		String GlobalMessage[], String SystemMessage[]
){}
}

